import pandas as pd
import numpy as np
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config import (
    TRANSFORMER_BUY_THRESHOLD,
    TRANSFORMER_SELL_THRESHOLD,
    TRANSFORMER_MOMENTUM_RATIO_THRESHOLD,
    TRANSFORMER_ENABLE_ADAPTIVE_THRESHOLDS,
    TRANSFORMER_MIN_BUY_SHARE,
    TRANSFORMER_ADAPTIVE_BUY_QUANTILE,
    TRANSFORMER_ADAPTIVE_SELL_QUANTILE,
    TRANSFORMER_ADAPTIVE_MIN_BUY_PROB,
)

def aggregate_transformer(transformer_df: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregates time-based transformer outputs into
    one summary row per security.
    Applies adaptive thresholds if BUY ratio is too low.
    """

    summary = (
        transformer_df
        .groupby("security")
        .agg(
            transformer_avg_score=("score", "mean"),
            transformer_last_score=("score", "last"),
            buy_ratio=("signal", lambda x: (x == "BUY").mean()),
            sell_ratio=("signal", lambda x: (x == "SELL").mean()),
            hold_ratio=("signal", lambda x: (x == "HOLD").mean()),
            total_signals=("signal", "count")
        )
        .reset_index()
    )

    # Determine adaptive thresholds based on overall score distribution
    if TRANSFORMER_ENABLE_ADAPTIVE_THRESHOLDS:
        all_scores = transformer_df["score"].values
        if len(all_scores) > 0:
            buy_share = float((all_scores > TRANSFORMER_BUY_THRESHOLD).mean())
            if buy_share < TRANSFORMER_MIN_BUY_SHARE:
                # Adapt to score distribution
                adaptive_buy = max(
                    float(np.quantile(all_scores, TRANSFORMER_ADAPTIVE_BUY_QUANTILE)),
                    TRANSFORMER_ADAPTIVE_MIN_BUY_PROB
                )
                adaptive_sell = min(
                    TRANSFORMER_SELL_THRESHOLD,
                    float(np.quantile(all_scores, TRANSFORMER_ADAPTIVE_SELL_QUANTILE))
                )
                if adaptive_sell >= adaptive_buy:
                    adaptive_sell = max(0.0, adaptive_buy - 0.05)
                buy_thresh = adaptive_buy
                sell_thresh = adaptive_sell
            else:
                buy_thresh = TRANSFORMER_BUY_THRESHOLD
                sell_thresh = TRANSFORMER_SELL_THRESHOLD
        else:
            buy_thresh = TRANSFORMER_BUY_THRESHOLD
            sell_thresh = TRANSFORMER_SELL_THRESHOLD
    else:
        buy_thresh = TRANSFORMER_BUY_THRESHOLD
        sell_thresh = TRANSFORMER_SELL_THRESHOLD

    # Human-readable momentum label using adaptive thresholds
    summary["transformer_momentum"] = summary.apply(
        lambda row:
            "Bullish" if (
                row.buy_ratio >= TRANSFORMER_MOMENTUM_RATIO_THRESHOLD
                or row.transformer_avg_score >= buy_thresh
            ) else (
                "Bearish" if (
                    row.sell_ratio >= TRANSFORMER_MOMENTUM_RATIO_THRESHOLD
                    or row.transformer_avg_score <= sell_thresh
                ) else "Neutral"
            ),
        axis=1
    )

    return summary
