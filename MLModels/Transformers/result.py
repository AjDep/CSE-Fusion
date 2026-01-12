import os
import pandas as pd
from predict_transformer import predict_transformer

if __name__ == "__main__":
    df = pd.read_csv("../DataSets/market-dashboard.csv")

    output = predict_transformer(df)

    os.makedirs("../outputs", exist_ok=True)
    output.to_csv("../outputs/transformer_output.csv", index=False)

    print("✅ Transformer output saved")
    print(output.tail(5))
