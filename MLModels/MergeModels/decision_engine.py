import pandas as pd
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from config import (
    FUSION_WEIGHT_KMEANS,
    FUSION_WEIGHT_CLASSIFIER,
    FUSION_WEIGHT_TRANSFORMER,
    FUSION_BUY_SCORE_THRESHOLD,
    FUSION_STRONG_BUY_SCORE_THRESHOLD,
    FUSION_SELL_SCORE_THRESHOLD,
)


def _normalized_signal(signal: str, default: str = "HOLD") -> str:
    if signal in {"BUY", "SELL", "HOLD"}:
        return signal
    return default


def _safe_probability(value, fallback_signal: str) -> float:
    try:
        prob = float(value)
        if 0.0 <= prob <= 1.0:
            return prob
    except (TypeError, ValueError):
        pass

    # Fallback score when probability is unavailable.
    if fallback_signal == "BUY":
        return 0.70
    if fallback_signal == "SELL":
        return 0.30
    return 0.50

def fuse_signals(kmeans: pd.DataFrame,
                 classifier: pd.DataFrame,
                 transformer: pd.DataFrame) -> pd.DataFrame:

    # Merge all models on security
    df = kmeans.merge(classifier, on="security", how="left")
    df = df.merge(transformer, on="security", how="left")

    final_signals = []

    for _, row in df.iterrows():
        regime = row.get("regime")
        km_signal = _normalized_signal(row.get("signal_kmeans"))
        clf_signal = _normalized_signal(row.get("signal_classifier"))
        tr_signal = _normalized_signal(row.get("signal_transformer"))
        clf_prob = _safe_probability(row.get("score_y"), clf_signal)
        tr_prob = _safe_probability(row.get("transformer_avg_score"), tr_signal)

        # Rule 1: Panic overrides everything
        if regime == "🛑 Panic Crash":
            final = "🔻 SELL"

        # Rule 2: Whale accumulation + classifier buy
        elif regime == "🐳 Whale Accumulation" and clf_signal == "BUY":
            final = "🟢 STRONG BUY"

        # Rule 3: classifier+transformer bearish agreement dominates unless kmeans strongly disagrees
        elif clf_signal == "SELL" and tr_signal == "SELL" and km_signal != "BUY":
            final = "🔻 SELL"
        else:
            signal_points = {"BUY": 1.0, "HOLD": 0.0, "SELL": -1.0}

            # Convert probabilities to centered confidence in [-1, +1].
            clf_centered = (clf_prob - 0.5) * 2.0
            tr_centered = (tr_prob - 0.5) * 2.0

            weighted_score = (
                signal_points[km_signal] * FUSION_WEIGHT_KMEANS
                + clf_centered * FUSION_WEIGHT_CLASSIFIER
                + tr_centered * FUSION_WEIGHT_TRANSFORMER
            )

            # Regime bias: accumulation slightly lifts score, panic drags score.
            if regime == "🐳 Whale Accumulation":
                weighted_score += 0.55
            elif regime == "🚀 Retail Momentum":
                weighted_score += 0.20
            elif regime == "🛑 Panic Crash":
                weighted_score -= 0.60

            # Guardrail: if KMeans flags buy in accumulation and score is near neutral, avoid forced sell.
            if regime == "🐳 Whale Accumulation" and km_signal == "BUY" and weighted_score > -0.10:
                weighted_score = max(weighted_score, FUSION_BUY_SCORE_THRESHOLD)

            if weighted_score >= FUSION_STRONG_BUY_SCORE_THRESHOLD and regime == "🐳 Whale Accumulation":
                final = "🟢 STRONG BUY"
            elif weighted_score >= FUSION_BUY_SCORE_THRESHOLD:
                final = "🟢 BUY"
            elif weighted_score <= FUSION_SELL_SCORE_THRESHOLD:
                final = "🔻 SELL"
            else:
                final = "⚖️ HOLD"

        final_signals.append(final)

    df["final_signal"] = final_signals
    return df