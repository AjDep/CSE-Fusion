import torch
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import sys
import os
from pathlib import Path

# Ensure MLModels root is importable so shared helpers resolve
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(PROJECT_ROOT))

from bid_api_client import load_with_fallback
from feature_engineering import add_obi
from Transformers.model import MarketTransformer

FEATURES = ['diff_percent', 'ppl_dominance', 'obi', 'total_bid', 'total_ask']
TIME_STEPS = 5
EPOCHS = 50
REQUIRED_COLUMNS = [
    'security',
    'recorded_at',
    'current_bid_price',
    'diff_percent',
    'ppl_dominance',
    'total_bid',
    'total_ask'
]

def create_sequences_by_security(df, feature_cols, target_col, time_steps):
    Xs, ys = [], []

    for _, group in df.groupby("security"):
        group = group.sort_values("recorded_at").copy()

        if len(group) <= time_steps:
            continue

        X_group = group[feature_cols].values
        y_group = group[target_col].values

        for i in range(len(group) - time_steps):
            Xs.append(X_group[i:i + time_steps])
            ys.append(y_group[i + time_steps])

    return np.array(Xs), np.array(ys)


# Load data
df = load_with_fallback(required_columns=REQUIRED_COLUMNS, allow_fallback=False)
df = add_obi(df)
df = df.sort_values(['security', 'recorded_at']).copy()

# Create next-step target correctly
df['next_price'] = df.groupby('security')['current_bid_price'].shift(-1)

# drop rows that have no future value
df = df.dropna(subset=['next_price']).copy()

df['target_is_up'] = (df['next_price'] > df['current_bid_price']).astype(int)

# optional extra cleanup
df = df.dropna(subset=FEATURES + ['target_is_up']).copy()

# scale features
scaler = StandardScaler()
df[FEATURES] = scaler.fit_transform(df[FEATURES])

# build sequences per stock
X_seq, y_seq = create_sequences_by_security(
    df=df,
    feature_cols=FEATURES,
    target_col='target_is_up',
    time_steps=TIME_STEPS
)

if len(X_seq) == 0:
    raise ValueError("No valid sequences were created for transformer training.")

X_tensor = torch.tensor(X_seq, dtype=torch.float32)
y_tensor = torch.tensor(y_seq, dtype=torch.float32).view(-1, 1)

model = MarketTransformer(feature_count=X_tensor.shape[2])
criterion = torch.nn.BCELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

for epoch in range(EPOCHS):
    optimizer.zero_grad()
    output = model(X_tensor)
    loss = criterion(output, y_tensor)
    loss.backward()
    optimizer.step()

    if (epoch + 1) % 10 == 0:
        print(f"Epoch {epoch+1}/{EPOCHS} | Loss: {loss.item():.4f}")

os.makedirs("models", exist_ok=True)
torch.save(model.state_dict(), "models/transformer.pt")
joblib.dump(scaler, "models/transformer_scaler.pkl")

print("✅ Transformer model saved")