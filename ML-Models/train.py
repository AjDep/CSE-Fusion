import pandas as pd
from market_regime_model import train_model, save_model

df = pd.read_csv("DataSets/market-dashboard.csv")

kmeans, scaler = train_model(df)
save_model(kmeans, scaler)

print("✅ Market Regime Model trained and saved")
