import os
import runpy
import sys
from pathlib import Path

import pandas as pd

from decision_engine import fuse_signals
from db_handler import DatabaseHandler


def run_result_script(script_path: Path, label: str) -> None:
    print(f"\n▶ Running {label} results...")
    original_cwd = Path.cwd()
    original_sys_path = list(sys.path)
    try:
        os.chdir(script_path.parent)
        sys.path.insert(0, str(script_path.parent))
        runpy.run_path(str(script_path), run_name="__main__")
        print(f"✅ {label} results completed")
    finally:
        os.chdir(original_cwd)
        sys.path = original_sys_path


root_dir = Path(__file__).resolve().parents[1]

# 1) Run all model result scripts to refresh CSV outputs
run_result_script(root_dir / "KMeans" / "result.py", "KMeans")
run_result_script(root_dir / "Clasification" / "result.py", "Classifier")
run_result_script(root_dir / "Transformers" / "result.py", "Transformer")

# 2) Load model outputs
kmeans = pd.read_csv(root_dir / "outputs" / "kmeans_output.csv")
classifier = pd.read_csv(root_dir / "outputs" / "classifier_output.csv")
transformer = pd.read_csv(root_dir / "outputs" / "transformer_output_summary.csv")

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
