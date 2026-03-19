import os
import pandas as pd
from predict_transformer import predict_transformer
from aggregate_transformer import aggregate_transformer
from db_loader import DBLoader
from config import MARKET_DATA_FILE

if __name__ == "__main__":

    # 1️⃣ Load data using MARKET_DATA_FILE (table or CSV)
    if os.path.exists(MARKET_DATA_FILE):
        df = pd.read_csv(MARKET_DATA_FILE)
        print(f"📄 Loaded CSV data from {MARKET_DATA_FILE}")
    else:
        loader = DBLoader()
        df = loader.load_from_table(MARKET_DATA_FILE)
        if df is None:
            fallback_csv = "../DataSets/market-dashboard.csv"
            if os.path.exists(fallback_csv):
                df = pd.read_csv(fallback_csv)
                print(f"⚠️ Using fallback CSV: {fallback_csv}")
            else:
                raise RuntimeError(f"Could not load data from {MARKET_DATA_FILE} or fallback CSV")
    df["recorded_at"] = df["created_at"]

    # 2️⃣ Run transformer (time-based momentum)
    transformer_raw = predict_transformer(df)

    # 3️⃣ Aggregate transformer output (per security)
    transformer_summary = aggregate_transformer(transformer_raw)

    # 4️⃣ Save outputs
    os.makedirs("../outputs", exist_ok=True)

    transformer_raw.to_csv(
        "../outputs/transformer_output_raw.csv",
        index=False
    )

    transformer_summary.to_csv(
        "../outputs/transformer_output_summary.csv",
        index=False
    )

    # 5️⃣ Logs
    print("✅ Transformer raw output saved (time-based)")
    print("✅ Transformer summary output saved (per security)")
    print("\n🔹 Raw output sample:")
    print(transformer_raw.tail(5))
    print("\n🔹 Summary output sample:")
    print(transformer_summary.head(5))
