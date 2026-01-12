import pandas as pd
from decision_engine import final_trade_decision

df = pd.read_csv("../outputs/merged_model_output.csv")

df["final_signal"] = df.apply(final_trade_decision, axis=1)

df.to_csv("../outputs/final_dashboard_output.csv", index=False)

print(df.tail(10))
