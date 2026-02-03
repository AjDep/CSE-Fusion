"""Database loader for ML models - fetches data from MySQL based on selected table"""
import mysql.connector
from mysql.connector import Error
import pandas as pd
import os
from dotenv import load_dotenv
from config import (
    get_selected_table, 
    DB_HOST, 
    DB_USER, 
    DB_PASS, 
    DB_NAME, 
    DB_PORT
)

# Load environment variables
load_dotenv('../.env')

class DBLoader:
    def __init__(self):
        self.host = DB_HOST
        self.user = DB_USER
        self.password = DB_PASS
        self.database = DB_NAME
        self.port = DB_PORT
        self.connection = None
    
    def connect(self):
        """Establish database connection"""
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database,
                port=self.port
            )
            print(f"✅ Connected to MySQL database: {self.database}")
            return self.connection
        except Error as e:
            print(f"⚠️ Could not connect to MySQL: {e}")
            return None
    
    def load_from_table(self, table_name):
        """Load data from specific database table"""
        if not self.connect():
            return None
        
        try:
            cursor = self.connection.cursor(dictionary=True)
            query = f"SELECT * FROM `{table_name}`"
            cursor.execute(query)
            rows = cursor.fetchall()
            cursor.close()
            
            if rows:
                df = pd.DataFrame(rows)
                print(f"✅ Loaded {len(df)} rows from table: {table_name}")
                return df
            else:
                print(f"⚠️ No data found in table: {table_name}")
                return None
        except Error as e:
            print(f"❌ Error loading data from table: {e}")
            return None
        finally:
            if self.connection:
                self.connection.close()
    
    def load_data(self):
        """Load data - tries database first, falls back to CSV"""
        selected_table = get_selected_table()
        
        if selected_table:
            print(f"📊 Using database table: {selected_table}")
            df = self.load_from_table(selected_table)
            if df is not None:
                return df
            else:
                print(f"⚠️ Falling back to CSV file")
        
        # Fall back to CSV
        csv_path = "../DataSets/today1.csv"
        try:
            if not os.path.exists(csv_path):
                raise FileNotFoundError(f"CSV file not found: {csv_path}")
            
            df = pd.read_csv(csv_path)
            print(f"✅ Loaded {len(df)} rows from CSV: {csv_path}")
            return df
        except Exception as e:
            print(f"❌ Error loading CSV file: {e}")
            return None


def load_data():
    """Convenience function to load data"""
    loader = DBLoader()
    return loader.load_data()
