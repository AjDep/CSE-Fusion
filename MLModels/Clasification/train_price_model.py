import pandas as pd
from price_direction_model import prepare_training_data, train_model, save_model

df = pd.read_csv("../DataSets/market-dashboard.csv")

X, y, df_clean = prepare_training_data(df)

# Time-based split (no leakage)
split = int(len(X) * 0.8)
X_train, X_test = X.iloc[:split], X.iloc[split:]
y_train, y_test = y.iloc[:split], y.iloc[split:]

model = train_model(X_train, y_train)
save_model(model)

print("✅ Price Direction Model trained and saved")
