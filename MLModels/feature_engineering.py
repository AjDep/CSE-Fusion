import pandas as pd

def add_obi(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df['obi'] = (df['total_bid'] - df['total_ask']) / (df['total_bid'] + df['total_ask'])
    df['obi'] = df['obi'].fillna(0)
    return df
