import pandas as pd
from predict_price import predict_next_move
pd.set_option('display.max_rows', None)
df_today = pd.read_csv("../DataSets/today1.csv")

result = predict_next_move(df_today)

print(result[['security', 'current_bid_price', 'ai_confidence', 'signal']])
