# Configuration for ML Models
# Centralized data paths for easy modification
import os
import json

# Database configuration
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASS = os.getenv('DB_PASS', '1234')
DB_NAME = os.getenv('DB_NAME', 'market_data')
DB_PORT = int(os.getenv('DB_PORT', 3306))

# Config file to store selected table - use absolute path from MLModels directory
MLMODELS_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(MLMODELS_DIR, 'selected_table.json')

def get_selected_table():
    """Get the currently selected table from config file or return default"""
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
                return config.get('table_name', None)
    except Exception as e:
        print(f"Warning: Could not read config file: {e}")
    return None


def get_selected_market_table(default_table="bid_vs_ask_master"):
    """Get market data source from config; default to the bid/ask master table"""
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
                return config.get('market_table_name', default_table)
    except Exception as e:
        print(f"Warning: Could not read config file: {e}")
    return default_table

def set_selected_table(table_name):
    """Save the selected table to config file"""
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump({'table_name': table_name}, f)
        return True
    except Exception as e:
        print(f"Error: Could not save config file: {e}")
        return False

# Get current table selections
SELECTED_TABLE = get_selected_table()
SELECTED_MARKET_TABLE = get_selected_market_table()

# Dataset paths - can be overridden by SELECTED_TABLE/SELECTED_MARKET_TABLE
TODAY_DATA_FILE = SELECTED_TABLE if SELECTED_TABLE else "../DataSets/today1.csv"
MARKET_DATA_FILE = SELECTED_MARKET_TABLE if SELECTED_MARKET_TABLE else "../DataSets/market-dashboard.csv"

# Output paths
OUTPUTS_DIR = "../outputs"

# Classification thresholds
CLASSIFIER_BUY_THRESHOLD = float(os.getenv('CLASSIFIER_BUY_THRESHOLD', 0.55))
CLASSIFIER_SELL_THRESHOLD = float(os.getenv('CLASSIFIER_SELL_THRESHOLD', 0.45))
CLASSIFIER_ENABLE_ADAPTIVE_THRESHOLDS = os.getenv('CLASSIFIER_ENABLE_ADAPTIVE_THRESHOLDS', '1') == '1'
CLASSIFIER_MIN_BUY_SHARE = float(os.getenv('CLASSIFIER_MIN_BUY_SHARE', 0.05))
CLASSIFIER_ADAPTIVE_BUY_QUANTILE = float(os.getenv('CLASSIFIER_ADAPTIVE_BUY_QUANTILE', 0.90))
CLASSIFIER_ADAPTIVE_SELL_QUANTILE = float(os.getenv('CLASSIFIER_ADAPTIVE_SELL_QUANTILE', 0.25))
CLASSIFIER_ADAPTIVE_MIN_BUY_PROB = float(os.getenv('CLASSIFIER_ADAPTIVE_MIN_BUY_PROB', 0.30))

# Transformer thresholds
TRANSFORMER_BUY_THRESHOLD = float(os.getenv('TRANSFORMER_BUY_THRESHOLD', 0.55))
TRANSFORMER_SELL_THRESHOLD = float(os.getenv('TRANSFORMER_SELL_THRESHOLD', 0.45))
TRANSFORMER_ENABLE_ADAPTIVE_THRESHOLDS = os.getenv('TRANSFORMER_ENABLE_ADAPTIVE_THRESHOLDS', '1') == '1'
TRANSFORMER_MIN_BUY_SHARE = float(os.getenv('TRANSFORMER_MIN_BUY_SHARE', 0.05))
TRANSFORMER_ADAPTIVE_BUY_QUANTILE = float(os.getenv('TRANSFORMER_ADAPTIVE_BUY_QUANTILE', 0.90))
TRANSFORMER_ADAPTIVE_SELL_QUANTILE = float(os.getenv('TRANSFORMER_ADAPTIVE_SELL_QUANTILE', 0.25))
TRANSFORMER_ADAPTIVE_MIN_BUY_PROB = float(os.getenv('TRANSFORMER_ADAPTIVE_MIN_BUY_PROB', 0.30))

# Momentum aggregation threshold for bullish/bearish label
TRANSFORMER_MOMENTUM_RATIO_THRESHOLD = float(
    os.getenv('TRANSFORMER_MOMENTUM_RATIO_THRESHOLD', 0.55)
)

# Fusion voting weights and decision cutoffs
FUSION_WEIGHT_KMEANS = float(os.getenv('FUSION_WEIGHT_KMEANS', 1.0))
FUSION_WEIGHT_CLASSIFIER = float(os.getenv('FUSION_WEIGHT_CLASSIFIER', 1.3))
FUSION_WEIGHT_TRANSFORMER = float(os.getenv('FUSION_WEIGHT_TRANSFORMER', 1.0))

FUSION_BUY_SCORE_THRESHOLD = float(os.getenv('FUSION_BUY_SCORE_THRESHOLD', 0.20))
FUSION_STRONG_BUY_SCORE_THRESHOLD = float(os.getenv('FUSION_STRONG_BUY_SCORE_THRESHOLD', 0.90))
FUSION_SELL_SCORE_THRESHOLD = float(os.getenv('FUSION_SELL_SCORE_THRESHOLD', -1.5))
