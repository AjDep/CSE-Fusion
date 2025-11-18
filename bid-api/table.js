// tables.js
const pool = require('./db');
const { normalizeSecurityForTable } = require('./utils');

// Core company table schema
const companyTableSchema = `
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
`;

async function ensureCompanyTable(security) {
  const tableName = `company_${normalizeSecurityForTable(security)}`;
  await pool.query(`CREATE TABLE IF NOT EXISTS \`${tableName}\` (${companyTableSchema}) ENGINE=InnoDB;`);
  return tableName;
}

const dailyTableSchema = `
  id INT AUTO_INCREMENT PRIMARY KEY,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  security VARCHAR(50) NOT NULL,
  total_bid BIGINT,
  total_ask BIGINT,
  diff_percent DECIMAL(10,4),
  total_bid_splits INT,
  total_ask_splits INT,
  top_bid_qty BIGINT,
  top_bid_price DECIMAL(18,6),
  current_bid_price DECIMAL(18,6),
  INDEX idx_security (security)
`;

async function ensureDailyTable(tableName) {
  await pool.query(`CREATE TABLE IF NOT EXISTS \`${tableName}\` (${dailyTableSchema}) ENGINE=InnoDB;`);
}

module.exports = { ensureCompanyTable, ensureDailyTable };
