import pandas as pd
from predict_transformer import predict_transformer

df = pd.read_csv("../DataSets/market-dashboard.csv")

output = predict_transformer(df)

print(output.tail(10))
