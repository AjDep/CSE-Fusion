import torch
import joblib
import numpy as np
import pandas as pd
from model import MarketTransformer
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from feature_engineering import add_obi

# Must match training
FEATURES = [
    'diff_percent',
    'ppl_dominance',
    'obi',
    'total_bid',
    'total_ask'
]

TIME_STEPS = 5
MODEL_PATH = "models/transformer.pt"
SCALER_PATH = "models/transformer_scaler.pkl"


def create_sequences(data, time_steps):
    sequences = []
    for i in range(len(data) - time_steps + 1):
        sequences.append(data[i:i + time_steps])
    return np.array(sequences)


def predict_transformer(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transformer-based momentum prediction.
    Output is standardized for multi-model fusion.
    """

    # 1️⃣ Feature engineering
    df = add_obi(df)
    df = df.sort_values(['security', 'recorded_at']).copy()

    # 2️⃣ Scale features
    scaler = joblib.load(SCALER_PATH)
    X_scaled = scaler.transform(df[FEATURES].fillna(0))

    # 3️⃣ Create sequences
    X_seq = create_sequences(X_scaled, TIME_STEPS)
    X_tensor = torch.tensor(X_seq, dtype=torch.float32)

    # 4️⃣ Load model
    model = MarketTransformer(feature_count=len(FEATURES))
    model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
    model.eval()

    # 5️⃣ Predict
    with torch.no_grad():
        probs = model(X_tensor).numpy().flatten()

    # 6️⃣ Align predictions with rows
    result = df.iloc[TIME_STEPS - 1:].copy()
    result['score'] = probs

    # 7️⃣ Trading signal
    result['signal'] = result['score'].apply(
        lambda x: "BUY" if x > 0.6 else ("SELL" if x < 0.4 else "HOLD")
    )

    # 8️⃣ Final standardized output
    return result[[
        'security',
        'recorded_at'
    ]].assign(
        score=result['score'].astype(float),
        signal=result['signal'],
        model='transformer'
    )


# ---- local test ----
if __name__ == "__main__":
    df = pd.read_csv("../DataSets/market-dashboard.csv")
    output = predict_transformer(df)
    print(output.tail(10))
    output.to_csv("transformer_predictions.csv", index=False)