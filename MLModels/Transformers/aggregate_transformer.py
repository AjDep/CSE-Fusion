import pandas as pd

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
            "Bullish" if row.buy_ratio > 0.6 else
            "Bearish" if row.sell_ratio > 0.6 else
            "Neutral",
        axis=1
    )

    return summary
