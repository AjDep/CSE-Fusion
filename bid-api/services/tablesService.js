// services/tablesService.js
const pool = require('../db');

class TablesService {
  async getAllTables() {
    const [rows] = await pool.query(`SHOW TABLES LIKE 'bid_vs_ask_%'`);
    const key = Object.keys(rows[0] || {})[0];
    return rows.map(r => r[key]);
  }
}

module.exports = new TablesService();