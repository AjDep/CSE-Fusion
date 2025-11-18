// migrate-old-data.js - Run this ONCE to migrate old company_history data
require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  });

  console.log('🔄 Starting migration from company_history to company-specific tables...');

  try {
    // Check if old table exists
    const [tables] = await pool.query("SHOW TABLES LIKE 'company_history'");
    if (tables.length === 0) {
      console.log('❌ No company_history table found. Nothing to migrate.');
      process.exit(0);
    }

    // Get all unique securities
    const [securities] = await pool.query(`
      SELECT DISTINCT security FROM company_history ORDER BY security
    `);

    console.log(`📊 Found ${securities.length} companies to migrate`);

    for (const { security } of securities) { 
      console.log(`\n🔄 Migrating ${security}...`);

      // Create company table
      const normalized = security.replace(/[^A-Z0-9]/g, '_');
      const tableName = `company_${normalized}`;

      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`${tableName}\` (
          id INT AUTO_INCREMENT PRIMARY KEY,
          recorded_at DATETIME NOT NULL,
          total_bid BIGINT,
          total_ask BIGINT,
          diff_percent DECIMAL(10,4),
          total_bid_splits INT,
          total_ask_splits INT,
          top_bid_qty BIGINT,
          top_bid_price DECIMAL(18,6),
          current_bid_price DECIMAL(18,6),
          source_table VARCHAR(100),
          INDEX idx_recorded_at (recorded_at)
        ) ENGINE=InnoDB;
      `);

      // Copy data
      const [result] = await pool.query(`
        INSERT INTO \`${tableName}\` (
          recorded_at, total_bid, total_ask, diff_percent,
          total_bid_splits, total_ask_splits, top_bid_qty,
          top_bid_price, current_bid_price, source_table
        )
        SELECT 
          recorded_at, total_bid, total_ask, diff_percent,
          total_bid_splits, total_ask_splits, top_bid_qty,
          top_bid_price, current_bid_price, source_table
        FROM company_history
        WHERE security = ?
        ORDER BY recorded_at ASC
      `, [security]);

      console.log(`   ✅ Migrated ${result.affectedRows} records`);

      // Register company
      const [stats] = await pool.query(`
        SELECT 
          MIN(recorded_at) as first_recorded,
          MAX(recorded_at) as last_recorded,
          COUNT(*) as total_snapshots
        FROM \`${tableName}\`
      `);

      await pool.query(`
        INSERT INTO companies (
          security, table_name, first_recorded, last_recorded, total_snapshots
        )
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          first_recorded = VALUES(first_recorded),
          last_recorded = VALUES(last_recorded),
          total_snapshots = VALUES(total_snapshots)
      `, [
        security,
        tableName,
        stats[0].first_recorded,
        stats[0].last_recorded,
        stats[0].total_snapshots
      ]);

      console.log(`   ✅ Registered in companies table`);
    }

    console.log('\n✅ Migration complete!');
    console.log('\n⚠️  To remove the old table (AFTER verifying everything works):');
    console.log('   DROP TABLE company_history;');

  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();