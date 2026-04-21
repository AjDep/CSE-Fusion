import os
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))

from bid_api_client import fetch_table
from config import MARKET_DATA_FILE, TODAY_DATA_FILE, get_selected_market_table, get_selected_table


def _default_csv_fallback() -> str:
    return os.path.abspath(
        os.path.join(Path(__file__).resolve().parent, "DataSets", "market-dashboard.csv")
    )


def _load_csv(path: str) -> pd.DataFrame:
    if not os.path.exists(path):
        raise FileNotFoundError(path)
    return pd.read_csv(path)


class DBLoader:
    def __init__(self, base_url=None, timeout: int = 30, csv_fallback: str | None = None):
        self.base_url = base_url
        self.timeout = timeout
        self.csv_fallback = csv_fallback or _default_csv_fallback()

    def load_from_table(self, table_name_or_path: str | None):
        source = table_name_or_path or get_selected_market_table(MARKET_DATA_FILE)

        if os.path.exists(source):
            return _load_csv(source)

        try:
            return fetch_table(source, base_url=self.base_url, timeout=self.timeout)
        except Exception as exc:
            if os.path.exists(self.csv_fallback):
                print(f"⚠️  Falling back to CSV after load failure ({exc}): {self.csv_fallback}")
                return _load_csv(self.csv_fallback)
            raise RuntimeError(
                f"Could not load data from table '{source}' and no CSV fallback exists"
            ) from exc


def load_data(table_name: str | None = None):
    source = table_name or get_selected_table() or TODAY_DATA_FILE
    loader = DBLoader()
    return loader.load_from_table(source)