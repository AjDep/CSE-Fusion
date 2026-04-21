import pandas as pd
import numpy as np
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from feature_engineering import add_obi
from price_direction_model import load_model, FEATURES, prepare_feature_frame
from config import (
    CLASSIFIER_BUY_THRESHOLD,
    CLASSIFIER_SELL_THRESHOLD,
    CLASSIFIER_ENABLE_ADAPTIVE_THRESHOLDS,
    CLASSIFIER_MIN_BUY_SHARE,
    CLASSIFIER_ADAPTIVE_BUY_QUANTILE,
    CLASSIFIER_ADAPTIVE_SELL_QUANTILE,
    CLASSIFIER_ADAPTIVE_MIN_BUY_PROB,
)


def _resolve_thresholds(probabilities):
    buy_threshold = CLASSIFIER_BUY_THRESHOLD
    sell_threshold = CLASSIFIER_SELL_THRESHOLD

    if not CLASSIFIER_ENABLE_ADAPTIVE_THRESHOLDS or len(probabilities) == 0:
        return buy_threshold, sell_threshold

    buy_share = float((probabilities > buy_threshold).mean())
    if buy_share >= CLASSIFIER_MIN_BUY_SHARE:
        return buy_threshold, sell_threshold

    adaptive_buy = max(
        float(np.quantile(probabilities, CLASSIFIER_ADAPTIVE_BUY_QUANTILE)),
        CLASSIFIER_ADAPTIVE_MIN_BUY_PROB,
    )
    adaptive_sell = min(
        sell_threshold,
        float(np.quantile(probabilities, CLASSIFIER_ADAPTIVE_SELL_QUANTILE)),
    )

    if adaptive_sell >= adaptive_buy:
        adaptive_sell = max(0.0, adaptive_buy - 0.05)

    return adaptive_buy, adaptive_sell


def predict_next_move(df_snapshot: pd.DataFrame):
    model = load_model()
    df_snapshot = add_obi(df_snapshot)
    df_snapshot = prepare_feature_frame(df_snapshot)
    X = df_snapshot[FEATURES]

    probs = model.predict_proba(X)[:, 1]
    buy_threshold, sell_threshold = _resolve_thresholds(probs)

    df = df_snapshot.copy()
    df['ai_confidence'] = probs

    df['signal'] = df['ai_confidence'].apply(
        lambda x: "🚀 BUY" if x > buy_threshold else
                  ("🔻 SELL / WAIT" if x < sell_threshold else "⚖️ HOLD")
    )

    return df
