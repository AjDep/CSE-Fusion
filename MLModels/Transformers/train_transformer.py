import torch
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from feature_engineering import add_obi
from Transformers.model import MarketTransformer

FEATURES = ['diff_percent', 'ppl_dominance', 'obi', 'total_bid', 'total_ask']
TIME_STEPS = 5
EPOCHS = 50

def create_sequences(X, y, time_steps):
    Xs, ys = [], []
    for i in range(len(X) - time_steps):
        Xs.append(X[i:i + time_steps])
        ys.append(y[i + time_steps])
    return np.array(Xs), np.array(ys)

# Load data
df = pd.read_csv("../DataSets/market-dashboard.csv")
df = add_obi(df)
df = df.sort_values(['security', 'recorded_at'])

df['next_price'] = df.groupby('security')['current_bid_price'].shift(-1)
df['target_is_up'] = (df['next_price'] > df['current_bid_price']).astype(int)
df = df.dropna(subset=['target_is_up'])

scaler = StandardScaler()
X_scaled = scaler.fit_transform(df[FEATURES])
y = df['target_is_up'].values

X_seq, y_seq = create_sequences(X_scaled, y, TIME_STEPS)

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

# Create models directory if it doesn't exist
os.makedirs("models", exist_ok=True)

# Save artifacts
torch.save(model.state_dict(), "models/transformer.pt")
joblib.dump(scaler, "models/transformer_scaler.pkl")

print("✅ Transformer model saved")
