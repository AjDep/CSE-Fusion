"""Database handler for saving trading signals to MySQL"""
import mysql.connector
from mysql.connector import Error
from datetime import datetime
import pandas as pd
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../.env')

class DatabaseHandler:
    def __init__(self, table_name='ml_trading_signals'):
        self.host = os.getenv('DB_HOST', 'localhost')
        self.user = os.getenv('DB_USER', 'root')
        self.password = os.getenv('DB_PASS', '')
        self.database = os.getenv('DB_NAME', 'trading_db')
        self.port = int(os.getenv('DB_PORT', 3306))
        self.connection = None
        self.table_name = table_name  # Fixed table name
    
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
            print(f"[OK] Connected to MySQL database: {self.database}")
            return self.connection
        except Error as e:
            print(f"[ERROR] Error connecting to MySQL: {e}")
            raise
    
    def create_or_replace_table(self, df):
        """Drop existing table and create new one with fresh schema"""
        if not self.connection:
            raise Exception("Database not connected")
        
        cursor = self.connection.cursor()
        
        try:
            # Drop table if exists to ensure fresh data
            cursor.execute(f"DROP TABLE IF EXISTS `{self.table_name}`")
            print(f"[DROP] Dropped existing table: {self.table_name}")
            
            # Build CREATE TABLE statement
            columns = []
            columns.append("id INT AUTO_INCREMENT PRIMARY KEY")
            columns.append("updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            columns.append("source_table VARCHAR(255)")  # Add source table column
            
            for col, dtype in df.dtypes.items():
                col_name = col.replace(' ', '_').replace('-', '_')
                if dtype == 'object':
                    col_type = 'VARCHAR(255)'
                elif dtype == 'float64':
                    col_type = 'DECIMAL(10, 6)'
                elif dtype == 'int64':
                    col_type = 'INT'
                else:
                    col_type = 'VARCHAR(255)'
                
                columns.append(f"`{col_name}` {col_type}")
            
            create_statement = f"CREATE TABLE `{self.table_name}` ({', '.join(columns)})"
            cursor.execute(create_statement)
            print(f"[OK] Created fresh table: {self.table_name}")
        except Error as e:
            print(f"[ERROR] Error creating table: {e}")
            raise
        finally:
            cursor.close()
    
    def insert_data(self, df, source_table=None):
        """Insert dataframe into database"""
        if not self.connection:
            raise Exception("Database not connected")
        
        cursor = self.connection.cursor()
        
        try:
            for _, row in df.iterrows():
                # Add source_table to columns
                columns = ['source_table'] + list(df.columns)
                placeholders = ', '.join(['%s'] * len(columns))
                columns_str = ', '.join([f"`{col}`" for col in columns])
                insert_statement = f"INSERT INTO `{self.table_name}` ({columns_str}) VALUES ({placeholders})"
                
                # Add source_table value to the beginning of values
                values = [source_table] + [None if pd.isna(v) else v for v in row.values]
                cursor.execute(insert_statement, values)
            
            self.connection.commit()
            print(f"[OK] Inserted {len(df)} rows into {self.table_name}")
        except Error as e:
            self.connection.rollback()
            print(f"[ERROR] Error inserting data: {e}")
            raise
        finally:
            cursor.close()
    
    def save_to_database(self, df, source_table=None):
        """Main method to save dataframe to database - overwrites existing table"""
        try:
            # Drop and recreate table with fresh schema
            self.create_or_replace_table(df)
            
            # Insert data with source table info
            self.insert_data(df, source_table)
            
            print(f"\n[SUCCESS] Trading signals successfully saved to table: {self.table_name}")
            print(f"[INFO] Total records: {len(df)}")
            if source_table:
                print(f"[INFO] Source table: {source_table}")
            return self.table_name
        except Exception as e:
            print(f"[ERROR] Failed to save to database: {e}")
            raise
    
    def close(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            print("[OK] Database connection closed")
