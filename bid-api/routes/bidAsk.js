// routes/bidAsk.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { asyncHandler } = require('../utils');

/* ------------------------------------------
   GENERATE DAILY TABLE NAME
------------------------------------------- */
async function tableNameForDate(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');

  const [tables] = await pool.query(
    `SHOW TABLES LIKE 'bid_vs_ask_${yyyy}_${mm}_${dd}_%';`
  );

  const nextNum = Math.min(tables.length + 1, 12);
  const suffix = String(nextNum).padStart(2, '0');

  const tableName = `bid_vs_ask_${yyyy}_${mm}_${dd}_${suffix}`;
  console.log('Generated table name:', tableName);
  return tableName;
}

/* ------------------------------------------
   DAILY TABLE CREATION
------------------------------------------- */
async function ensureDailyTable(tableName) {
  const sql = `
    CREATE TABLE IF NOT EXISTS \`${tableName}\` (
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
      current_bid_price DECIMAL(18,6)
    ) ENGINE=InnoDB;
  `;
  await pool.query(sql);
}

/* ------------------------------------------
   HISTORY TABLE CREATION
------------------------------------------- */
async function ensureHistoryTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS company_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      security VARCHAR(50) NOT NULL,
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
      INDEX idx_security (security),
      INDEX idx_recorded_at (recorded_at)
    ) ENGINE=InnoDB;
  `;
  await pool.query(sql);
}

/* ------------------------------------------
   MASTER COMPANIES TABLE CREATION
------------------------------------------- */
async function ensureCompaniesTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS companies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      security VARCHAR(50) NOT NULL UNIQUE,
      company_name VARCHAR(255),
      exchange VARCHAR(50),
      table_name VARCHAR(255),
      first_recorded DATETIME,
      last_recorded DATETIME,
      total_snapshots INT DEFAULT 0,
      is_active TINYINT DEFAULT 1,
      INDEX idx_security (security)
    ) ENGINE=InnoDB;
  `;

  await pool.query(sql);
}

/* ------------------------------------------
   BASIC RECORD VALIDATION
------------------------------------------- */
function validateRecord(r) {
  return r && typeof r.security === 'string' && r.security.trim().length > 0;
}

/* ------------------------------------------
   INSERT INTO DAILY TABLE
------------------------------------------- */
async function insertRecords(conn, tableName, records) {
  if (!records.length) return 0;

  const columns = [
    'security', 'total_bid', 'total_ask', 'diff_percent',
    'total_bid_splits', 'total_ask_splits', 'top_bid_qty',
    'top_bid_price', 'current_bid_price'
  ];

  const placeholders = records
    .map(() => '(' + columns.map(() => '?').join(',') + ')')
    .join(',');

  const sql = `
    INSERT INTO \`${tableName}\` (${columns.join(',')})
    VALUES ${placeholders}
  `;

  const values = [];
  for (const r of records) {
    values.push(
      r.security,
      Number(r.totalBid) || 0,
      Number(r.totalAsk) || 0,
      Number(r.diffPercent) || 0,
      Number(r.totalBidSplits) || 0,
      Number(r.totalAskSplits) || 0,
      Number(r.topBidQty) || 0,
      r.topBidPrice != null ? Number(r.topBidPrice) : null,
      r.currentBidPrice != null ? Number(r.currentBidPrice) : null
    );
  }

  const [result] = await conn.query(sql, values);
  return result.affectedRows || 0;
}

/* ------------------------------------------
   INSERT INTO HISTORY TABLE
------------------------------------------- */
async function insertHistoryRecords(conn, tableName, records) {
  if (!records.length) return;

  const sql = `
    INSERT INTO company_history (
      security, recorded_at, total_bid, total_ask, diff_percent,
      total_bid_splits, total_ask_splits, top_bid_qty,
      top_bid_price, current_bid_price, source_table
    )
    VALUES ?
  `;

  const now = new Date();
  const values = records.map(r => [
    r.security,
    now,
    r.totalBid || 0,
    r.totalAsk || 0,
    r.diffPercent || 0,
    r.totalBidSplits || 0,
    r.totalAskSplits || 0,
    r.topBidQty || 0,
    r.topBidPrice || null,
    r.currentBidPrice || null,
    tableName
  ]);

  await conn.query(sql, [values]);
}

/* ------------------------------------------
   ENSURE COMPANY TABLE EXISTS
------------------------------------------- */
async function ensureCompanyTable(security) {
  // Normalize security name for table (remove dots, special chars)
  const normalized = security.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const tableName = `company_${normalized}`;

  const sql = `
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
  `;

  await pool.query(sql);
  return tableName;
}

/* ------------------------------------------
   INSERT INTO COMPANY TABLE
------------------------------------------- */
async function insertIntoCompanyTable(conn, companyTableName, tableName, record, timestamp) {
  const sql = `
    INSERT INTO \`${companyTableName}\` (
      recorded_at, total_bid, total_ask, diff_percent,
      total_bid_splits, total_ask_splits, top_bid_qty,
      top_bid_price, current_bid_price, source_table
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await conn.query(sql, [
    timestamp,
    record.totalBid || 0,
    record.totalAsk || 0,
    record.diffPercent || 0,
    record.totalBidSplits || 0,
    record.totalAskSplits || 0,
    record.topBidQty || 0,
    record.topBidPrice || null,
    record.currentBidPrice || null,
    tableName
  ]);
}

/* ------------------------------------------
   ENSURE / UPDATE MASTER COMPANIES ROW
   - Keeps company_name and exchange NULL by default (per user request)
   - Updates last_recorded, total_snapshots, table_name, is_active
------------------------------------------- */
async function ensureCompanyExists(conn, security, companyTableName, timestamp) {
  // We'll use INSERT ... ON DUPLICATE KEY UPDATE to either insert or update
  const insertSql = `
    INSERT INTO companies (security, table_name, first_recorded, last_recorded, total_snapshots, is_active)
    VALUES (?, ?, ?, ?, 1, 1)
    ON DUPLICATE KEY UPDATE
      last_recorded = VALUES(last_recorded),
      table_name = VALUES(table_name),
      total_snapshots = total_snapshots + 1,
      is_active = 1
  `;

  await conn.query(insertSql, [security, companyTableName, timestamp, timestamp]);
}

/* ------------------------------------------
   ROUTES
------------------------------------------- */

// POST: Store bid-ask analysis
router.post('/store-bid-ask', asyncHandler(async (req, res) => {
  await ensureHistoryTable();
  await ensureCompaniesTable();

  const records = Array.isArray(req.body.records) ? req.body.records : [];
  if (!records.length) {
    return res.status(400).json({ error: 'No records provided' });
  }

  const dateObj = req.body.date ? new Date(req.body.date) : new Date();
  if (isNaN(dateObj)) {
    return res.status(400).json({ error: 'Invalid date' });
  }

  const tableName = await tableNameForDate(dateObj);
  await ensureDailyTable(tableName);

  const validRecords = records
    .filter(validateRecord)
    .map(r => ({
      security: r.security,
      totalBid: r.totalBid ?? 0,
      totalAsk: r.totalAsk ?? 0,
      diffPercent: r.diffPercent ?? 0,
      totalBidSplits: r.totalBidSplits ?? 0,
      totalAskSplits: r.totalAskSplits ?? 0,
      topBidQty: r.topBidQty ?? 0,
      topBidPrice: r.topBidPrice ?? null,
      currentBidPrice: r.currentBidPrice ?? null
    }));

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const timestamp = new Date();

    // 1. Insert into daily snapshot table (single bulk insert)
    const inserted = await insertRecords(conn, tableName, validRecords);

    // 2. Insert into global company_history table (bulk)
    await insertHistoryRecords(conn, tableName, validRecords);

    // 3. For each record ensure company table exists, insert company row, and insert into company-specific table
    for (const record of validRecords) {
      // Ensure per-company table exists
      const companyTableName = await ensureCompanyTable(record.security);

      // Ensure companies master row exists / update it
      await ensureCompanyExists(conn, record.security, companyTableName, timestamp);

      // Insert into the company-specific time-series table
      await insertIntoCompanyTable(conn, companyTableName, tableName, record, timestamp);
    }

    await conn.commit();
    conn.release();

    res.json({
      inserted,
      table: tableName,
      companiesUpdated: validRecords.length
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    throw err;
  }
}));

// GET: Fetch data from specific table
router.get('/:tableName', asyncHandler(async (req, res) => {
  const { tableName } = req.params;
  const [rows] = await pool.query(`SELECT * FROM \`${tableName}\``);
  res.json(rows);
}));

// GET: Company history
router.get('/history/:security', asyncHandler(async (req, res) => {
  const security = req.params.security.toUpperCase();
  const [rows] = await pool.query(
    `SELECT * FROM company_history WHERE security = ? ORDER BY recorded_at ASC`,
    [security]
  );
  res.json(rows);
}));

// GET: Master companies list
router.get('/companies/list', asyncHandler(async (req, res) => {
  await ensureCompaniesTable();
  const [rows] = await pool.query(`SELECT * FROM companies ORDER BY security ASC`);
  res.json(rows);
}));

module.exports = router;
