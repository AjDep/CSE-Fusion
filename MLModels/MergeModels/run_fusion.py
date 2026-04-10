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
from llm_analyzer import SignalAnalyzer, format_analysis_report
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from config import get_selected_table


def print_signal_distribution(label: str, series: pd.Series) -> None:
    counts = series.value_counts(dropna=False)
    ratios = series.value_counts(dropna=False, normalize=True)
    print(f"\n[DIAGNOSTIC] {label} distribution:")
    for key in counts.index:
        pct = ratios.loc[key] * 100
        print(f"  - {key}: {counts.loc[key]} ({pct:.1f}%)")


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

print_signal_distribution("KMeans signal_kmeans", kmeans["signal_kmeans"])
print_signal_distribution("Classifier signal_classifier", classifier["signal_classifier"])
print_signal_distribution("Transformer signal_transformer", transformer["signal_transformer"])

# Generate final signals
final = fuse_signals(kmeans, classifier, transformer)
print_signal_distribution("Final final_signal", final["final_signal"])

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

# 3) Generate LLM-based analysis and descriptions
print("\n" + "="*70)
print("🤖 GENERATING AI-POWERED SIGNAL ANALYSIS...")
print("="*70)

analyzer = SignalAnalyzer(use_openai=False)  # Set to True if OPENAI_API_KEY is env var
analysis = analyzer.analyze_signals(final)
analysis_report = format_analysis_report(analysis)

print(analysis_report)

# Save analysis report
os.makedirs("outputs", exist_ok=True)
report_path = "outputs/analysis_report.txt"
with open(report_path, "w", encoding="utf-8") as f:
    f.write(analysis_report)
print(f"\n[OK] Analysis report saved to: {report_path}")

# Save detailed analysis as JSON for dashboard/API consumption
try:
    import json
    analysis_json = {
        "timestamp": pd.Timestamp.now().isoformat(),
        "distribution": analysis["signal_distribution"],
        "regime_breakdown": analysis["regime_breakdown"],
        "top_opportunities": analysis["strong_buy_securities"],
        "buy_candidates": analysis["buy_securities"],
    }
    json_path = "outputs/analysis_summary.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(analysis_json, f, indent=2, default=str)
    print(f"[OK] Analysis summary saved to: {json_path}")
except Exception as e:
    print(f"⚠️ Could not save JSON analysis: {e}")
