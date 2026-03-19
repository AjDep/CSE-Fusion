import os
import runpy
import sys
from pathlib import Path

# Set UTF-8 encoding for stdout/stderr on Windows BEFORE any other imports
if sys.platform == 'win32':
    import io
    if hasattr(sys.stdout, 'buffer'):
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
    if hasattr(sys.stderr, 'buffer'):
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace', line_buffering=True)

import pandas as pd

from decision_engine import fuse_signals
from db_handler import DatabaseHandler  
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from config import get_selected_table


def run_result_script(script_path: Path, label: str) -> None:
    print(f"\n> Running {label} results...")
    original_cwd = Path.cwd()
    original_sys_path = list(sys.path)
    try:
        os.chdir(script_path.parent)
        sys.path.insert(0, str(script_path.parent))
        runpy.run_path(str(script_path), run_name="__main__")
        print(f"[OK] {label} results completed")
    finally:
        os.chdir(original_cwd)
        sys.path = original_sys_path


root_dir = Path(__file__).resolve().parents[1]

# 1) Run all model result scripts to refresh CSV outputs
run_result_script(root_dir / "KMeans" / "result.py", "KMeans")
run_result_script(root_dir / "Clasification" / "result.py", "Classifier")
run_result_script(root_dir / "Transformers" / "result.py", "Transformer")

# 2) Load model outputs
# Load model outputs
kmeans = pd.read_csv(root_dir / "outputs" / "kmeans_output.csv").rename(
    columns={"signal": "signal_kmeans"}
)

classifier = pd.read_csv(root_dir / "outputs" / "classifier_output.csv").rename(
    columns={"signal": "signal_classifier"}
)

transformer = pd.read_csv(root_dir / "outputs" / "transformer_output_summary.csv")

# map transformer momentum into standard BUY/SELL/HOLD language
transformer["signal_transformer"] = transformer["transformer_momentum"].map({
    "Bullish": "BUY",
    "Bearish": "SELL",
    "Neutral": "HOLD"
})
classifier["signal_classifier"] = classifier["signal_classifier"].replace({
    "🚀 BUY": "BUY",
    "🔻 SELL / WAIT": "SELL",
    "⚖️ HOLD": "HOLD"
})
kmeans["signal_kmeans"] = kmeans["signal_kmeans"].replace({
    "Potential Buy (low noise)": "BUY",
    "Ride the wave (short-term, use stop-loss)": "HOLD",
    "Exit / Avoid": "SELL"
})
print("KMeans columns:", kmeans.columns.tolist())
print("Classifier columns:", classifier.columns.tolist())
print("Transformer columns:", transformer.columns.tolist())
print(transformer[["security", "transformer_momentum", "signal_transformer"]].head())
# Generate final signals
final = fuse_signals(kmeans, classifier, transformer)

# Get the source table that was analyzed
source_table = get_selected_table()
if not source_table:
    source_table = "today1.csv"  # Fallback to CSV if no table selected

# Save to database
db = DatabaseHandler()
try:
    db.connect()
    table_name = db.save_to_database(final, source_table=source_table)
    print(f"\n[SUCCESS] Final signals generated and saved to database table: {table_name}")
finally:
    db.close()

# Also save to CSV for backup
os.makedirs("outputs", exist_ok=True)
final.to_csv("outputs/final_trading_signals.csv", index=False)
print("[OK] Backup CSV saved")

print("\n[INFO] Sample of generated signals:")
print(final[['security', 'regime', 'final_signal']].head(20))
