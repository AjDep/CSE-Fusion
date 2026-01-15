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
    def __init__(self):
        self.host = os.getenv('DB_HOST', 'localhost')
        self.user = os.getenv('DB_USER', 'root')
        self.password = os.getenv('DB_PASS', '')
        self.database = os.getenv('DB_NAME', 'trading_db')
        self.port = int(os.getenv('DB_PORT', 3306))
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
            print(f"❌ Error connecting to MySQL: {e}")
            raise
    
    def generate_table_name(self):
        """Generate table name with format: YYYY_MM_DD_Day_HH:MM"""
        now = datetime.now()
        day_name = now.strftime('%a')  # Mon, Tue, etc.
        table_name = now.strftime('%Y_%m_%d') + '_' + day_name + '_' + now.strftime('%H:%M')
        return table_name
    
    def create_table(self, table_name, df):
        """Create table if it doesn't exist"""
        if not self.connection:
            raise Exception("Database not connected")
        
        cursor = self.connection.cursor()
        
        # Drop table if exists (optional - comment out if you want to append)
        # cursor.execute(f"DROP TABLE IF EXISTS `{table_name}`")
        
        # Build CREATE TABLE statement
        columns = []
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
        
        create_statement = f"CREATE TABLE IF NOT EXISTS `{table_name}` ({', '.join(columns)})"
        
        try:
            cursor.execute(create_statement)
            print(f"✅ Table created/verified: {table_name}")
        except Error as e:
            print(f"❌ Error creating table: {e}")
            raise
        finally:
            cursor.close()
    
    def insert_data(self, table_name, df):
        """Insert dataframe into database"""
        if not self.connection:
            raise Exception("Database not connected")
        
        cursor = self.connection.cursor()
        
        try:
            for _, row in df.iterrows():
                columns = ', '.join([f"`{col}`" for col in df.columns])
                placeholders = ', '.join(['%s'] * len(df.columns))
                insert_statement = f"INSERT INTO `{table_name}` ({columns}) VALUES ({placeholders})"
                
                values = [None if pd.isna(v) else v for v in row.values]
                cursor.execute(insert_statement, values)
            
            self.connection.commit()
            print(f"✅ Inserted {len(df)} rows into {table_name}")
        except Error as e:
            self.connection.rollback()
            print(f"❌ Error inserting data: {e}")
            raise
        finally:
            cursor.close()
    
    def save_to_database(self, df):
        """Main method to save dataframe to database with timestamp-based table name"""
        try:
            # Generate table name
            table_name = self.generate_table_name()
            
            # Create table
            self.create_table(table_name, df)
            
            # Insert data
            self.insert_data(table_name, df)
            
            print(f"\n✨ Trading signals successfully saved to table: {table_name}")
            return table_name
        except Exception as e:
            print(f"❌ Failed to save to database: {e}")
            raise
    
    def close(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            print("✅ Database connection closed")
