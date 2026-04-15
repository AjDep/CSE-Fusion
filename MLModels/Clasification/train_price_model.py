import os
import sys

# Ensure shared helpers are importable
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from bid_api_client import load_with_fallback
from price_direction_model import prepare_training_data, train_model, save_model

REQUIRED_COLUMNS = [
	"security",
	"recorded_at",
	"current_bid_price",
	"diff_percent",
	"ppl_dominance",
	"total_bid",
	"total_ask",
	"top_bid_qty",
	"tot_turnover",
	"tot_volume",
]

df = load_with_fallback(required_columns=REQUIRED_COLUMNS, allow_fallback=False)

X, y, df_clean = prepare_training_data(df)

# Time-based split (no leakage)
split = int(len(X) * 0.8)
X_train, X_test = X.iloc[:split], X.iloc[split:]
y_train, y_test = y.iloc[:split], y.iloc[split:]

model = train_model(X_train, y_train)
save_model(model)

print("✅ Price Direction Model trained and saved")
