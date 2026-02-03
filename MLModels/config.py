# Configuration for ML Models
# Centralized data paths for easy modification
import os
import json

# Database configuration
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASS = os.getenv('DB_PASS', '')
DB_NAME = os.getenv('DB_NAME', 'trading_db')
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

def set_selected_table(table_name):
    """Save the selected table to config file"""
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump({'table_name': table_name}, f)
        return True
    except Exception as e:
        print(f"Error: Could not save config file: {e}")
        return False

# Get current table selection - can be database table or CSV file
SELECTED_TABLE = get_selected_table()

# Dataset paths - can be overridden by SELECTED_TABLE
TODAY_DATA_FILE = SELECTED_TABLE if SELECTED_TABLE else "../DataSets/today1.csv"
MARKET_DATA_FILE = "../DataSets/market-dashboard.csv"

# Output paths
OUTPUTS_DIR = "../outputs"
