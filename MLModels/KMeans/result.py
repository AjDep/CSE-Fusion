import os
import pandas as pd
from predict import predict_today
from config import TODAY_DATA_FILE

df_today = pd.read_csv(TODAY_DATA_FILE)

result = predict_today(df_today)

# Keep only what we need
output = result[[
    "security",
    "regime",
    "action"
]].copy()

# Standardise columns
output.rename(columns={
    "action": "signal"
}, inplace=True)

output["score"] = None  # K-Means has no probability
output["model"] = "kmeans"

# Save
os.makedirs("../outputs", exist_ok=True)
output.to_csv("../outputs/kmeans_output.csv", index=False)

print("✅ K-Means output saved")
print(output.head())
