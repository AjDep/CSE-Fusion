// services/tablesService.js
const pool = require('../db');

class TablesService {
  async getAllTables() {
    const [rows] = await pool.query(`SHOW TABLES`);
    if (!rows || rows.length === 0) return [];

    const key = Object.keys(rows[0] || {})[0];
    if (!key) return [];

    // Keep only bid/ask snapshot tables and the ML output table, drop master/aux tables
    const allowed = rows
      .map(r => r[key])
      .filter(name => {
        if (!name) return false;
        if (name === 'ml_trading_signals') return true;
        if (name.startsWith('bid_vs_ask_master')) return false;
        return name.startsWith('bid_vs_ask_');
      })
      .sort();

    return allowed;
  }
}

module.exports = new TablesService();