import os
from typing import Iterable, Optional

import pandas as pd
import requests

# Shared API client for fetching market data from bid-api
BASE_URL = os.getenv("BID_API_BASE_URL", "http://localhost:5000")
DEFAULT_TABLE = os.getenv("BID_API_TABLE", "bid_vs_ask_master")
DEFAULT_CSV_FALLBACK = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "DataSets", "market-dashboard.csv")
)


def _build_url(table_name: str, base_url: str) -> str:
    return f"{base_url.rstrip('/')}/api/{table_name}"


def fetch_table(
    table_name: Optional[str] = None,
    *,
    base_url: Optional[str] = None,
    timeout: int = 30,
) -> pd.DataFrame:
    """Fetch a table from bid-api and return a DataFrame."""
    table = table_name or DEFAULT_TABLE
    url = _build_url(table, base_url or BASE_URL)
    resp = requests.get(url, timeout=timeout)
    resp.raise_for_status()
    data = resp.json()
    if not isinstance(data, list):
        raise ValueError(f"Unexpected payload shape from {url}: {type(data)}")
    return pd.DataFrame(data)


def load_with_fallback(
    *,
    table_name: Optional[str] = None,
    required_columns: Optional[Iterable[str]] = None,
    csv_fallback: Optional[str] = None,
    base_url: Optional[str] = None,
    timeout: int = 30,
    allow_fallback: bool = True,
) -> pd.DataFrame:
    """Fetch data from API, fall back to CSV if needed, and validate required columns."""
    fallback_path = csv_fallback or DEFAULT_CSV_FALLBACK
    table = table_name or DEFAULT_TABLE

    try:
        df = fetch_table(table, base_url=base_url, timeout=timeout)
        if required_columns:
            missing = [col for col in required_columns if col not in df.columns]
            if missing:
                raise ValueError(f"Missing columns from API response: {', '.join(missing)}")
        print(f"✅ Loaded {len(df)} rows from {table} via API")
        return df
    except Exception as exc:
        if not allow_fallback:
            raise
        print(f"⚠️  API load failed ({exc}); falling back to CSV: {fallback_path}")
        df = pd.read_csv(fallback_path)
        if required_columns:
            missing = [col for col in required_columns if col not in df.columns]
            if missing:
                raise ValueError(
                    f"Missing columns from CSV fallback: {', '.join(missing)}"
                )
        print(f"✅ Loaded {len(df)} rows from CSV fallback")
        return df
