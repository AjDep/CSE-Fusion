// records.js
const pool = require('./db');

async function insertIntoCompanyTable(tableName, record, sourceTable) {
  await pool.query(`
    INSERT INTO \`${tableName}\` (
      recorded_at, total_bid, total_ask, diff_percent,
      total_bid_splits, total_ask_splits, top_bid_qty,
      top_bid_price, current_bid_price, source_table
    ) VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    record.totalBid || 0,
    record.totalAsk || 0,
    record.diffPercent || 0,
    record.totalBidSplits || 0,
    record.totalAskSplits || 0,
    record.topBidQty || 0,
    record.topBidPrice || null,
    record.currentBidPrice || null,
    sourceTable
  ]);
}

async function insertIntoRecentCache(record) {
  await pool.query(`
    INSERT INTO recent_snapshots (
      security, recorded_at, total_bid, total_ask, diff_percent,
      total_bid_splits, total_ask_splits, top_bid_qty,
      top_bid_price, current_bid_price
    ) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    record.security,
    record.totalBid || 0,
    record.totalAsk || 0,
    record.diffPercent || 0,
    record.totalBidSplits || 0,
    record.totalAskSplits || 0,
    record.topBidQty || 0,
    record.topBidPrice || null,
    record.currentBidPrice || null
  ]);
}

module.exports = { insertIntoCompanyTable, insertIntoRecentCache };
