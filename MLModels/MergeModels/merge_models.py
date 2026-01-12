import pandas as pd

def merge_model_outputs(
    regime_df: pd.DataFrame,
    gb_df: pd.DataFrame,
    transformer_df: pd.DataFrame
) -> pd.DataFrame:

    df = regime_df.merge(
        gb_df,
        on=["security", "recorded_at"],
        how="left"
    )

    df = df.merge(
        transformer_df,
        on=["security", "recorded_at"],
        how="left"
    )

    return df
