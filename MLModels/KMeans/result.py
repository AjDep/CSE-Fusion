import os
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from predict import predict_today
from db_loader import load_data

# Load data from database table (if selected) or CSV
df_today = load_data()

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
