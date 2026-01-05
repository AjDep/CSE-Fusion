import pandas as pd
from predict import predict_today
df_today = pd.read_csv("DataSets/today.csv")

result = predict_today(df_today)

watchlist = result[result["cluster"] == 3]  # Whale Accumulation

print(watchlist[["security", "regime", "action"]])
