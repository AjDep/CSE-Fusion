import os
import pandas as pd
from predict_price import predict_next_move

pd.set_option('display.max_rows', None)

# Load data
df_today = pd.read_csv("../DataSets/today1.csv")

# Run classifier
result = predict_next_move(df_today)

# Standardise output format
output = result[[
    'security',
    'ai_confidence',
    'signal'
]].copy()

output.rename(columns={
    'ai_confidence': 'score'
}, inplace=True)

output['model'] = 'classifier'

# Save output
os.makedirs("../outputs", exist_ok=True)
output.to_csv("../outputs/classifier_output.csv", index=False)

# Console preview
print("✅ Classifier predictions saved")
print(output.head(20))
