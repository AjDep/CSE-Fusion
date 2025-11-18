import json
import mysql.connector
from datetime import date

# --- 1️⃣ Connect to MySQL ---
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="1234",
    database="market_data"
)
cursor = db.cursor()

# --- 2️⃣ Load JSON data (exported from your extension) ---
with open("bid_vs_ask_analysis.json", "r") as f:
    data = json.load(f)

# --- 3️⃣ Insert each record ---
query = """
INSERT INTO bid_vs_ask_analysis (
    record_date, security, bid_dominance, total_bid_orders,
    total_ask_orders, total_bid, total_ask, top_bid_qty,
    top_bid_price, current_highest_bid
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
"""

today = date.today()

for r in data:
    cursor.execute(query, (
        today,
        r["security"],
        r["diffPercent"],
        r["totalBidSplits"],
        r["totalAskSplits"],
        r["totalBid"],
        r["totalAsk"],
        r["topBidQty"],
        r["topBidPrice"],
        r["currentBidPrice"]
    ))

db.commit()
print(f"{cursor.rowcount} records inserted successfully.")
cursor.close()
db.close()
