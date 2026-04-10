import pandas as pd
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config import (
    TRANSFORMER_BUY_THRESHOLD,
    TRANSFORMER_SELL_THRESHOLD,
    TRANSFORMER_MOMENTUM_RATIO_THRESHOLD,
)

def aggregate_transformer(transformer_df: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregates time-based transformer outputs into
    one summary row per security.
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

    # Human-readable momentum label
    summary["transformer_momentum"] = summary.apply(
        lambda row:
            "Bullish" if (
                row.buy_ratio >= TRANSFORMER_MOMENTUM_RATIO_THRESHOLD
                or row.transformer_avg_score >= TRANSFORMER_BUY_THRESHOLD
            ) else (
                "Bearish" if (
                    row.sell_ratio >= TRANSFORMER_MOMENTUM_RATIO_THRESHOLD
                    or row.transformer_avg_score <= TRANSFORMER_SELL_THRESHOLD
                ) else "Neutral"
            ),
        axis=1
    )

    return summary
