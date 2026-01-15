import pandas as pd
import os
from decision_engine import fuse_signals
from db_handler import DatabaseHandler

# Load model outputs
kmeans = pd.read_csv("../outputs/kmeans_output.csv")
classifier = pd.read_csv("../outputs/classifier_output.csv")
transformer = pd.read_csv("../outputs/transformer_output_summary.csv")

# Generate final signals
final = fuse_signals(kmeans, classifier, transformer)

# Save to database
db = DatabaseHandler()
try:
    db.connect()
    table_name = db.save_to_database(final)
    print(f"\n✅ Final signals generated and saved to database table: {table_name}")
finally:
    db.close()

# Also save to CSV for backup
os.makedirs("outputs", exist_ok=True)
final.to_csv("outputs/final_trading_signals.csv", index=False)
print("✅ Backup CSV saved")

print("\n📊 Sample of generated signals:")
print(final[['security', 'regime', 'final_signal']].head(20))
