import os
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from predict_price import predict_next_move
from db_loader import DBLoader, load_data
from config import MARKET_DATA_FILE, get_selected_market_table

pd.set_option('display.max_rows', None)

# Load data from database table (if selected) or CSV
df_selected = load_data()

# The classifier is trained on time-series behavior. Score on market table,
# then keep the latest row per security for the selected universe.
market_source = get_selected_market_table(MARKET_DATA_FILE)
df_market = DBLoader().load_from_table(market_source)

if 'recorded_at' not in df_market.columns and 'created_at' in df_market.columns:
    df_market['recorded_at'] = df_market['created_at']

selected_securities = None
if 'security' in df_selected.columns:
    selected_securities = set(df_selected['security'].astype(str))
    df_market = df_market[df_market['security'].astype(str).isin(selected_securities)]

# Run classifier
result = predict_next_move(df_market)

if selected_securities is not None:
    result = result[result['security'].astype(str).isin(selected_securities)]

if 'recorded_at' in result.columns:
    result = (
        result
        .sort_values(['security', 'recorded_at'])
        .groupby('security', as_index=False)
        .tail(1)
    )
else:
    result = result.drop_duplicates(subset=['security'], keep='last')

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
