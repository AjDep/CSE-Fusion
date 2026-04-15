import os
import sys

# Ensure MLModels root is on sys.path so shared helpers are importable
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from bid_api_client import load_with_fallback
from market_regime_model import train_model, save_model

REQUIRED_COLUMNS = ["total_bid", "total_ask", "diff_percent", "ppl_dominance", "tot_turnover", "tot_volume"]


if __name__ == "__main__":
    df = load_with_fallback(required_columns=REQUIRED_COLUMNS, allow_fallback=False)
    print(f"🔢 Training on {len(df)} rows")
    kmeans, scaler = train_model(df)
    save_model(kmeans, scaler)
    print("✅ Market Regime Model trained and saved")
