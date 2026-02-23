// services/companiesService.js
const pool = require('../db');

class CompaniesService {
  async getAllActiveCompanies() {
    const [rows] = await pool.query(`
      SELECT security, company_name, exchange,
             first_recorded, last_recorded, total_snapshots, is_active
      FROM companies
      WHERE is_active = TRUE
      ORDER BY last_recorded DESC
    `);
    return rows;
  }

  async getCompanyHistory(security, filters = {}) {
    const { startDate, endDate, limit } = filters;

    // get table name from companies registry
    const [companyRows] = await pool.query(
      'SELECT table_name FROM companies WHERE security = ?',
      [security]
    );

    if (companyRows.length === 0) {
      throw new Error('Company not found');
    }

    const tableName = companyRows[0].table_name;

    // build query with optional filters
    let sql = `SELECT * FROM \`${tableName}\` WHERE 1=1`;
    const params = [];

    if (startDate) {
      sql += ' AND recorded_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND recorded_at <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY recorded_at DESC';

    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit));
    }

    const [rows] = await pool.query(sql, params);
    return { security, count: rows.length, data: rows };
  }
}

module.exports = new CompaniesService();