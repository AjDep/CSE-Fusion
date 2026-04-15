// services/bidAskService.js
const pool = require('../db');

class BidAskService {
  /* ----------------------------------
     TABLE NAME GENERATION
  ----------------------------------- */
  async generateTableNameForDate(date = new Date()) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    const [tables] = await pool.query(
      `SHOW TABLES LIKE 'bid_vs_ask_${yyyy}_${mm}_${dd}_%';`
    );

    const nextNum = Math.min(tables.length + 1, 12);
    const suffix = String(nextNum).padStart(2, '0');

    const tableName = `bid_vs_ask_${yyyy}_${mm}_${dd}_${suffix}`;
    console.log('Generated table name:', tableName);
    return tableName;
  }

  /* ----------------------------------
     TABLE CREATION
  ----------------------------------- */
  async ensureDailyTable(tableName) {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`${tableName}\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        security VARCHAR(50) NOT NULL,
        total_bid BIGINT,
        total_ask BIGINT,
        tot_volume BIGINT,
        tot_turnover DECIMAL(20,4),
        diff_percent DECIMAL(10,4),
        ppl_dominance DECIMAL(10,4),
        total_bid_splits INT,
        total_ask_splits INT,
        top_bid_qty BIGINT,
        top_bid_price DECIMAL(18,6),
        current_bid_price DECIMAL(18,6)
      ) ENGINE=InnoDB;
    `;
    await pool.query(sql);

    // Add missing columns if table already exists
    const alterSqls = [
      `ALTER TABLE \`${tableName}\` ADD COLUMN tot_volume BIGINT`,
      `ALTER TABLE \`${tableName}\` ADD COLUMN tot_turnover DECIMAL(20,4)`,
      `ALTER TABLE \`${tableName}\` DROP COLUMN buy_sentiment`,
      `ALTER TABLE \`${tableName}\` DROP COLUMN cash_in`,
      `ALTER TABLE \`${tableName}\` DROP COLUMN trade_price`,
      `ALTER TABLE \`${tableName}\` DROP COLUMN trade_size`,
      `ALTER TABLE \`${tableName}\` ADD COLUMN ppl_dominance DECIMAL(10,4)`,
      `ALTER TABLE \`${tableName}\` ADD COLUMN total_bid_splits INT`,
      `ALTER TABLE \`${tableName}\` ADD COLUMN total_ask_splits INT`,
      `ALTER TABLE \`${tableName}\` ADD COLUMN top_bid_qty BIGINT`,
      `ALTER TABLE \`${tableName}\` ADD COLUMN top_bid_price DECIMAL(18,6)`,
      `ALTER TABLE \`${tableName}\` ADD COLUMN current_bid_price DECIMAL(18,6)`
    ];

    for (const alterSql of alterSqls) {
      try {
        await pool.query(alterSql);
      } catch (error) {
        // Ignore if column already exists
        if (!this.shouldIgnoreAlterError(error)) {
          throw error;
        }
      }
    }
  }

  async ensureHistoryTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS company_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        security VARCHAR(50) NOT NULL,
        recorded_at DATETIME NOT NULL,
        total_bid BIGINT,
        total_ask BIGINT,
        tot_volume BIGINT,
        tot_turnover DECIMAL(20,4),
        diff_percent DECIMAL(10,4),
        ppl_dominance DECIMAL(10,4),
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

    // Add missing columns if table already exists
    const alterSqls = [
      `ALTER TABLE company_history ADD COLUMN tot_volume BIGINT`,
      `ALTER TABLE company_history ADD COLUMN tot_turnover DECIMAL(20,4)`,
      `ALTER TABLE company_history DROP COLUMN buy_sentiment`,
      `ALTER TABLE company_history DROP COLUMN cash_in`,
      `ALTER TABLE company_history DROP COLUMN trade_price`,
      `ALTER TABLE company_history DROP COLUMN trade_size`,
      `ALTER TABLE company_history ADD COLUMN ppl_dominance DECIMAL(10,4)`,
      `ALTER TABLE company_history ADD COLUMN total_bid_splits INT`,
      `ALTER TABLE company_history ADD COLUMN total_ask_splits INT`,
      `ALTER TABLE company_history ADD COLUMN top_bid_qty BIGINT`,
      `ALTER TABLE company_history ADD COLUMN top_bid_price DECIMAL(18,6)`,
      `ALTER TABLE company_history ADD COLUMN current_bid_price DECIMAL(18,6)`,
      `ALTER TABLE company_history ADD COLUMN source_table VARCHAR(100)`,
      `ALTER TABLE company_history ADD INDEX idx_security (security)`,
      `ALTER TABLE company_history ADD INDEX idx_recorded_at (recorded_at)`
    ];

    for (const alterSql of alterSqls) {
      try {
        await pool.query(alterSql);
      } catch (error) {
        // Ignore if column/index already exists
        if (!this.shouldIgnoreAlterError(error)) {
          throw error;
        }
      }
    }
  }

  async ensureCompaniesTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        security VARCHAR(50) NOT NULL UNIQUE,
        company_name VARCHAR(255),
        exchange VARCHAR(50),
        latest_tot_volume BIGINT,
        latest_tot_turnover DECIMAL(20,4),
        table_name VARCHAR(255),
        first_recorded DATETIME,
        last_recorded DATETIME,
        total_snapshots INT DEFAULT 0,
        is_active TINYINT DEFAULT 1,
        INDEX idx_security (security)
      ) ENGINE=InnoDB;
    `;
    await pool.query(sql);

    const alterSqls = [
      `ALTER TABLE companies ADD COLUMN company_name VARCHAR(255)`,
      `ALTER TABLE companies ADD COLUMN exchange VARCHAR(50)`,
      `ALTER TABLE companies ADD COLUMN latest_tot_volume BIGINT`,
      `ALTER TABLE companies ADD COLUMN latest_tot_turnover DECIMAL(20,4)`,
      `ALTER TABLE companies DROP COLUMN latest_buy_sentiment`,
      `ALTER TABLE companies DROP COLUMN latest_cash_in`,
      `ALTER TABLE companies DROP COLUMN latest_trade_price`,
      `ALTER TABLE companies DROP COLUMN latest_trade_size`
    ];

    for (const alterSql of alterSqls) {
      try {
        await pool.query(alterSql);
      } catch (error) {
        if (!this.shouldIgnoreAlterError(error)) {
          throw error;
        }
      }
    }
  }

  async ensureCompanyTable(security) {
    // Normalize security name for table (remove dots, special chars)
    const normalized = security.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const tableName = `company_${normalized}`;

    const sql = `
      CREATE TABLE IF NOT EXISTS \`${tableName}\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recorded_at DATETIME NOT NULL,
        total_bid BIGINT,
        total_ask BIGINT,
        tot_volume BIGINT,
        tot_turnover DECIMAL(20,4),
        diff_percent DECIMAL(10,4),
        ppl_dominance DECIMAL(10,4),
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

    // Add missing columns if table already exists
    const alterSqls = [
      `ALTER TABLE \`${tableName}\` ADD COLUMN tot_volume BIGINT`,
      `ALTER TABLE \`${tableName}\` ADD COLUMN tot_turnover DECIMAL(20,4)`,
      `ALTER TABLE \`${tableName}\` DROP COLUMN buy_sentiment`,
      `ALTER TABLE \`${tableName}\` DROP COLUMN cash_in`,
      `ALTER TABLE \`${tableName}\` DROP COLUMN trade_price`,
      `ALTER TABLE \`${tableName}\` DROP COLUMN trade_size`,
      `ALTER TABLE \`${tableName}\` ADD COLUMN ppl_dominance DECIMAL(10,4)`,
      `ALTER TABLE \`${tableName}\` ADD COLUMN total_bid_splits INT`,
      `ALTER TABLE \`${tableName}\` ADD COLUMN total_ask_splits INT`,
      `ALTER TABLE \`${tableName}\` ADD COLUMN top_bid_qty BIGINT`,
      `ALTER TABLE \`${tableName}\` ADD COLUMN top_bid_price DECIMAL(18,6)`,
      `ALTER TABLE \`${tableName}\` ADD COLUMN current_bid_price DECIMAL(18,6)`,
      `ALTER TABLE \`${tableName}\` ADD COLUMN source_table VARCHAR(100)`,
      `ALTER TABLE \`${tableName}\` ADD INDEX idx_recorded_at (recorded_at)`
    ];

    for (const alterSql of alterSqls) {
      try {
        await pool.query(alterSql);
      } catch (error) {
        // Ignore if column/index already exists
        if (!this.shouldIgnoreAlterError(error)) {
          throw error;
        }
      }
    }
    return tableName;
  }

  /* ----------------------------------
     DATA INSERTION
  ----------------------------------- */
  async insertRecords(conn, tableName, records) {
    if (!records.length) return 0;

    const columns = [
      'security', 'total_bid', 'total_ask', 'tot_volume', 'tot_turnover',
      'diff_percent', 'ppl_dominance',
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
        Number(r.totVolume) || 0,
        r.totTurnover != null ? Number(r.totTurnover) : null,
        Number(r.diffPercent) || 0,
        Number(r.pplDominance) || 0,
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

  async insertHistoryRecords(conn, tableName, records) {
    if (!records.length) return;

    const sql = `
      INSERT INTO company_history (
        security, recorded_at, total_bid, total_ask, tot_volume, tot_turnover,
        diff_percent, ppl_dominance,
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
      r.totVolume || 0,
      r.totTurnover != null ? r.totTurnover : null,
      r.diffPercent || 0,
      r.pplDominance || 0,
      r.totalBidSplits || 0,
      r.totalAskSplits || 0,
      r.topBidQty || 0,
      r.topBidPrice || null,
      r.currentBidPrice || null,
      tableName
    ]);

    await conn.query(sql, [values]);
  }

  async insertIntoCompanyTable(conn, companyTableName, tableName, record, timestamp) {
    const sql = `
      INSERT INTO \`${companyTableName}\` (
        recorded_at, total_bid, total_ask, tot_volume, tot_turnover,
        diff_percent, ppl_dominance,
        total_bid_splits, total_ask_splits, top_bid_qty,
        top_bid_price, current_bid_price, source_table
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await conn.query(sql, [
      timestamp,
      record.totalBid || 0,
      record.totalAsk || 0,
      record.totVolume || 0,
      record.totTurnover != null ? record.totTurnover : null,
      record.diffPercent || 0,
      record.pplDominance || 0,
      record.totalBidSplits || 0,
      record.totalAskSplits || 0,
      record.topBidQty || 0,
      record.topBidPrice || null,
      record.currentBidPrice || null,
      tableName
    ]);
  }

  async ensureCompanyExists(conn, security, companyTableName, timestamp, record) {
    const insertSql = `
      INSERT INTO companies (
        security, company_name, table_name, first_recorded, last_recorded,
        total_snapshots, is_active, latest_tot_volume, latest_tot_turnover
      )
      VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?)
      ON DUPLICATE KEY UPDATE
        company_name = COALESCE(VALUES(company_name), company_name),
        last_recorded = VALUES(last_recorded),
        table_name = VALUES(table_name),
        total_snapshots = total_snapshots + 1,
        latest_tot_volume = VALUES(latest_tot_volume),
        latest_tot_turnover = VALUES(latest_tot_turnover),
        is_active = 1
    `;

    await conn.query(insertSql, [
      security,
      record.companyName || null,
      companyTableName,
      timestamp,
      timestamp,
      record.totVolume || 0,
      record.totTurnover != null ? record.totTurnover : null
    ]);
  }

  /* ----------------------------------
     DATA RETRIEVAL
  ----------------------------------- */
  async getTableData(tableName) {
    const [rows] = await pool.query(`SELECT * FROM \`${tableName}\``);
    return rows;
  }

  async getCompanyHistory(security) {
    const [rows] = await pool.query(
      `SELECT * FROM company_history WHERE security = ? ORDER BY recorded_at ASC`,
      [security]
    );
    return rows;
  }

  async getAllCompanies() {
    await this.ensureCompaniesTable();
    const [rows] = await pool.query(`SELECT * FROM companies ORDER BY security ASC`);
    return rows;
  }

  /* ----------------------------------
     BUSINESS LOGIC
  ----------------------------------- */
  validateRecord(record) {
    return record && typeof record.security === 'string' && record.security.trim().length > 0;
  }

  parseMarketNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const normalized = String(value).replace(/,/g, '').trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  shouldIgnoreAlterError(error) {
    const message = error?.message || '';
    return (
      message.includes('Duplicate column name') ||
      message.includes('Duplicate key name') ||
      message.includes("Can't DROP") ||
      message.includes("Can't change") ||
      message.includes('Unknown column')
    );
  }

  async ensureMasterTableColumns() {
    const [tables] = await pool.query(`SHOW TABLES LIKE 'bid_vs_ask_master'`);
    if (!tables || tables.length === 0) return;

    const alterSqls = [
      `ALTER TABLE bid_vs_ask_master ADD COLUMN tot_volume BIGINT`,
      `ALTER TABLE bid_vs_ask_master ADD COLUMN tot_turnover DECIMAL(20,4)`,
      `ALTER TABLE bid_vs_ask_master DROP COLUMN buy_sentiment`,
      `ALTER TABLE bid_vs_ask_master DROP COLUMN cash_in`,
      `ALTER TABLE bid_vs_ask_master DROP COLUMN trade_price`,
      `ALTER TABLE bid_vs_ask_master DROP COLUMN trade_size`
    ];

    for (const alterSql of alterSqls) {
      try {
        await pool.query(alterSql);
      } catch (error) {
        if (!this.shouldIgnoreAlterError(error)) {
          throw error;
        }
      }
    }
  }

async storeBidAskData(records, date) {
  await this.ensureHistoryTable();
  await this.ensureCompaniesTable();

  if (!records.length) {
    throw new Error('No records provided');
  }

  const dateObj = date ? new Date(date) : new Date();
  if (isNaN(dateObj)) {
    throw new Error('Invalid date');
  }

  const tableName = await this.generateTableNameForDate(dateObj);
  console.log('Table name:', tableName);

  // Parse table name correctly using regex
  // Expected format: bid_vs_ask_YYYY_MM_DD_BB
  const match = tableName.match(/^bid_vs_ask_(\d{4})_(\d{2})_(\d{2})_(\d{2})$/);

  if (!match) {
    console.error(`Table name parsing failed for: ${tableName}`);
    throw new Error(`Invalid table name format: ${tableName}. Expected format: bid_vs_ask_YYYY_MM_DD_BB`);
  }

  const [, year, month, day, batch] = match;
  // Validate year, month, day, batch
  if (!year || !month || !day || !batch) {
    console.error('Parsed values:', { year, month, day, batch });
    throw new Error(`Failed to parse snapshot date/batch from table name: ${tableName}`);
  }
  // Validate date
  const snapshotDate = `${year}-${month}-${day}`;
  if (isNaN(Date.parse(snapshotDate))) {
    console.error('Invalid snapshotDate:', snapshotDate);
    throw new Error(`Parsed snapshotDate is not a valid date: ${snapshotDate}`);
  }
  const snapshotBatch = batch;

  console.log('Parsed snapshot date:', snapshotDate);
  console.log('Parsed snapshot batch:', snapshotBatch);

  await this.ensureDailyTable(tableName);
  await this.ensureMasterTableColumns();

  const validRecords = records
    .filter(this.validateRecord)
    .map(r => ({
      security: r.security,
      companyName: r.companyName || r.company_name || r.companyname || null,
      totalBid: this.parseMarketNumber(r.totalBid) || 0,
      totalAsk: this.parseMarketNumber(r.totalAsk) || 0,
      totVolume: this.parseMarketNumber(r.totVolume ?? r.tot_volume ?? r.totvolume) || 0,
      totTurnover: this.parseMarketNumber(r.totTurnover ?? r.tot_turnover ?? r.totturnover),
      diffPercent: this.parseMarketNumber(r.diffPercent) || 0,
      pplDominance: this.parseMarketNumber(r.pplDominance) || 0,
      totalBidSplits: this.parseMarketNumber(r.totalBidSplits) || 0,
      totalAskSplits: this.parseMarketNumber(r.totalAskSplits) || 0,
      topBidQty: this.parseMarketNumber(r.topBidQty) || 0,
      topBidPrice: this.parseMarketNumber(r.topBidPrice),
      currentBidPrice: this.parseMarketNumber(r.currentBidPrice)
    }));
  console.log('Valid records:', validRecords.length);

  const conn = await pool.getConnection();
  console.log('Got DB connection');

  try {
    await conn.beginTransaction();

    const timestamp = new Date();

      // 1. Insert into daily snapshot table (single bulk insert)
    const inserted = await this.insertRecords(conn, tableName, validRecords);

    // 1.5 Insert into master table with correctly parsed date and batch
    await this.insertIntoMasterTable(conn, tableName, snapshotDate, snapshotBatch, validRecords);

    // 2. Insert into global company_history table (bulk insert)
    await this.insertHistoryRecords(conn, tableName, validRecords);

    // 3. For each record ensure company table exists, insert company row, and insert into company-specific table
    for (const record of validRecords) {
      // Ensure per-company table exists
      const companyTableName = await this.ensureCompanyTable(record.security);

      // Ensure companies master row exists / update it
      await this.ensureCompanyExists(conn, record.security, companyTableName, timestamp, record);

      // Insert into the company-specific time-series table
      await this.insertIntoCompanyTable(conn, companyTableName, tableName, record, timestamp);
    }

    await conn.commit();
    conn.release();

    return {
      inserted,
      table: tableName,
      snapshotDate,
      snapshotBatch,
      companiesUpdated: validRecords.length
    };
  } catch (err) {
    console.error('Error in transaction:', err);
    await conn.rollback();
    conn.release();
    throw err;
  }
}

  /* ----------------------------------
   MASTER TABLE INSERTION
----------------------------------- */
async insertIntoMasterTable(conn,sourceTable, snapshotDate, snapshotBatch, records) {
  if (!records.length) return;

  const sql = `
    INSERT IGNORE INTO bid_vs_ask_master (
      snapshot_date,
      snapshot_batch,
      source_table,
      recorded_at,
      security,
      total_bid,
      total_ask,
      tot_volume,
      tot_turnover,
      diff_percent,
      ppl_dominance,
      total_bid_splits,
      total_ask_splits,
      top_bid_qty,
      top_bid_price,
      current_bid_price
    )
    VALUES ?
  `;

  const values = records.map(r => [
    snapshotDate,
    snapshotBatch,
    sourceTable,
    new Date(), // recorded_at (or you can use r.recordedAt if available)
    r.security,
    r.totalBid,
    r.totalAsk,
    r.totVolume,
    r.totTurnover,
    r.diffPercent,
    r.pplDominance,
    r.totalBidSplits,
    r.totalAskSplits,
    r.topBidQty,
    r.topBidPrice,
    r.currentBidPrice
  ]);

  await conn.query(sql, [values]);
}

  /* ----------------------------------
     BID DOMINANCE CALCULATION
  ----------------------------------- */
  calculateBidDominance(totalBid, totalAsk, bids) {
    if (totalBid === 0) return { diffPercent: 0, topBidEntry: {} };
    const diffPercent = ((totalBid - totalAsk) / totalBid) * 100;
    const topBidEntry = bids.reduce((max, cur) => (parseFloat(cur.qty || 0) > parseFloat(max.qty || 0) ? cur : max), bids[0] || {});
    return { diffPercent: Number(diffPercent.toFixed(2)), topBidEntry };
  }

  calculatePplDominance(totalBidSplits, totalAskSplits) {
    if (totalBidSplits + totalAskSplits === 0) return 0;
    const dominance = ((totalBidSplits - totalAskSplits) / (totalBidSplits + totalAskSplits)) * 100;
    return Number(dominance.toFixed(2));
  }
}

module.exports = new BidAskService(); 