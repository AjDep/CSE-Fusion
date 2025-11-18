require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateCompanyHistory() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  });

  try {
    // Get all bid_vs_ask tables
    const [tables] = await pool.query("SHOW TABLES LIKE 'bid_vs_ask_%'");
    console.log(`Found ${tables.length} tables to process.`);

    for (const row of tables) {
      const tableName = Object.values(row)[0];
      console.log(`\nProcessing ${tableName}...`);

      // Copy data to company_history, skipping duplicates if needed
      const [result] = await pool.query(`
        INSERT INTO company_history
        (recorded_at, security, total_bid, total_ask, diff_percent, total_bid_splits, total_ask_splits,
         top_bid_qty, top_bid_price, current_bid_price, source_table)
        SELECT recorded_at, security, total_bid, total_ask, diff_percent, total_bid_splits, total_ask_splits,
               top_bid_qty, top_bid_price, current_bid_price, ?
        FROM \`${tableName}\`
        ON DUPLICATE KEY UPDATE
          total_bid = VALUES(total_bid),
          total_ask = VALUES(total_ask),
          diff_percent = VALUES(diff_percent),
          total_bid_splits = VALUES(total_bid_splits),
          total_ask_splits = VALUES(total_ask_splits),
          top_bid_qty = VALUES(top_bid_qty),
          top_bid_price = VALUES(top_bid_price),
          current_bid_price = VALUES(current_bid_price)
      `, [tableName]);

      console.log(`Inserted/Updated ${result.affectedRows} rows from ${tableName}`);
    }

    console.log('\n✅ Company history updated with all bid_vs_ask tables!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
}

updateCompanyHistory();
