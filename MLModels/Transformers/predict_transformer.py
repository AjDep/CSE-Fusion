import torch
import joblib
import numpy as np
import pandas as pd
from model import MarketTransformer
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from feature_engineering import add_obi
from config import (
    TRANSFORMER_BUY_THRESHOLD, 
    TRANSFORMER_SELL_THRESHOLD,
    TRANSFORMER_ENABLE_ADAPTIVE_THRESHOLDS,
    TRANSFORMER_MIN_BUY_SHARE,
    TRANSFORMER_ADAPTIVE_BUY_QUANTILE,
    TRANSFORMER_ADAPTIVE_SELL_QUANTILE,
    TRANSFORMER_ADAPTIVE_MIN_BUY_PROB
)

# Must match training
FEATURES = [
    'diff_percent',
    'ppl_dominance',
    'obi',
    'total_bid',
    'total_ask',
    'tot_turnover',
    'tot_volume'
]

TIME_STEPS = 5
MODEL_PATH = "models/transformer.pt"
SCALER_PATH = "models/transformer_scaler.pkl"


def _resolve_momentum_thresholds(scores):
    """
    Apply adaptive thresholds to transformer scores if BUY share is too low.
    Prevents 100% SELL collapse on bearish data.
    """
    if not TRANSFORMER_ENABLE_ADAPTIVE_THRESHOLDS or len(scores) == 0:
        return TRANSFORMER_BUY_THRESHOLD, TRANSFORMER_SELL_THRESHOLD
    
    buy_share = float((scores > TRANSFORMER_BUY_THRESHOLD).mean())
    
    # If enough BUY signals exist, use fixed thresholds
    if buy_share >= TRANSFORMER_MIN_BUY_SHARE:
        return TRANSFORMER_BUY_THRESHOLD, TRANSFORMER_SELL_THRESHOLD
    
    # Adapt to score distribution
    adaptive_buy = max(
        float(np.quantile(scores, TRANSFORMER_ADAPTIVE_BUY_QUANTILE)),
        TRANSFORMER_ADAPTIVE_MIN_BUY_PROB
    )
    adaptive_sell = min(
        TRANSFORMER_SELL_THRESHOLD,
        float(np.quantile(scores, TRANSFORMER_ADAPTIVE_SELL_QUANTILE))
    )
    
    # Ensure sell < buy
    if adaptive_sell >= adaptive_buy:
        adaptive_sell = max(0.0, adaptive_buy - 0.05)
    
    return adaptive_buy, adaptive_sell


def create_sequences_by_security_for_inference(df, feature_cols, time_steps):
    sequences = []
    meta_rows = []

    for _, group in df.groupby("security"):
        group = group.sort_values("recorded_at").copy()

        if len(group) < time_steps:
            continue

        X_group = group[feature_cols].values

        for i in range(len(group) - time_steps):
            sequences.append(X_group[i:i + time_steps])

            # attach prediction to the last row of this window
            meta_rows.append(
                group.iloc[i + time_steps][['security', 'recorded_at']].to_dict()
            )
    X_seq = np.array(sequences)
    meta_df = pd.DataFrame(meta_rows).reset_index(drop=True)
    return X_seq, meta_df


def predict_transformer(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transformer-based momentum prediction.
    Output is standardized for multi-model fusion.
    """

    # 1. Feature engineering
    df = add_obi(df)
    df = df.sort_values(['security', 'recorded_at']).copy()
    for col in FEATURES:
        if col not in df.columns:
            df[col] = 0

    # 2. Scale features
    scaler = joblib.load(SCALER_PATH)
    df[FEATURES] = scaler.transform(df[FEATURES].fillna(0))

    # 3. Create sequences per security
    X_seq, meta_df = create_sequences_by_security_for_inference(
        df=df,
        feature_cols=FEATURES,
        time_steps=TIME_STEPS
    )

    if len(X_seq) == 0:
        return pd.DataFrame(columns=['security', 'recorded_at', 'score', 'signal', 'model'])

    X_tensor = torch.tensor(X_seq, dtype=torch.float32)

    # 4. Load model
    model = MarketTransformer(feature_count=len(FEATURES))
    model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
    model.eval()

    # 5. Predict
    with torch.no_grad():
        probs = model(X_tensor).numpy().flatten()

    # 6. Align predictions with rows
    result = meta_df.copy()
    result['score'] = probs

    # 7. Resolve thresholds (adaptive if too many SELL)
    buy_threshold, sell_threshold = _resolve_momentum_thresholds(probs)

    # 8. Trading signal
    result['signal'] = result['score'].apply(
        lambda x: "BUY" if x > buy_threshold else (
            "SELL" if x < sell_threshold else "HOLD"
        )
    )

    # 9. Final standardized output
    return result[['security', 'recorded_at']].assign(
        score=result['score'].astype(float),
        signal=result['signal'],
        model='transformer'
    )


# ---- local test ----
if __name__ == "__main__":
    df = pd.read_csv("../DataSets/market-dashboard.csv")

    # Map timestamp column for transformer
    df["recorded_at"] = df["created_at"]

    output = predict_transformer(df)
    print(df.columns) 
    print(output.tail(10))
    output.to_csv("transformer_predictions.csv", index=False)