import argparse
import os
import runpy
import sys
from pathlib import Path


def run_script(script_path: Path, label: str) -> None:
    print(f"\n> Running {label}...")
    original_cwd = Path.cwd()
    original_sys_path = list(sys.path)
    try:
        os.chdir(script_path.parent)
        sys.path.insert(0, str(script_path.parent))
        runpy.run_path(str(script_path), run_name="__main__")
        print(f"[OK] {label} finished")
    finally:
        os.chdir(original_cwd)
        sys.path = original_sys_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Train all ML models and optionally run fusion")
    parser.add_argument("--skip-fusion", action="store_true", help="Skip running fusion after training")
    args = parser.parse_args()

    root = Path(__file__).resolve().parent

    train_scripts = [
        (root / "KMeans" / "train.py", "KMeans training"),
        (root / "Clasification" / "train_price_model.py", "Classifier training"),
        (root / "Transformers" / "train_transformer.py", "Transformer training"),
    ]

    for path, label in train_scripts:
        if not path.exists():
            print(f"[WARN] Missing script: {path}")
            continue
        run_script(path, label)

    if args.skip_fusion:
        print("\n[INFO] Skipping fusion as requested")
        return

    fusion_script = root / "MergeModels" / "run_fusion.py"
    if fusion_script.exists():
        run_script(fusion_script, "Fusion (results refresh + merge)")
    else:
        print(f"[WARN] Fusion script not found at {fusion_script}")


if __name__ == "__main__":
    main()