// companies.js
const pool = require('./db');

async function registerCompany(security, tableName) {
  await pool.query(`
    INSERT INTO companies (security, table_name, first_recorded, last_recorded, total_snapshots)
    VALUES (?, ?, NOW(), NOW(), 1)
    ON DUPLICATE KEY UPDATE
      last_recorded = NOW(),
      total_snapshots = total_snapshots + 1
  `, [security, tableName]);
}

async function getCompanyTable(security) {
  const [rows] = await pool.query(
    'SELECT table_name FROM companies WHERE security = ?',
    [security.toUpperCase()]
  );
  return rows.length > 0 ? rows[0].table_name : null;
}

async function getAllCompanies() {
  const [rows] = await pool.query(`
    SELECT security, company_name, exchange, first_recorded, last_recorded, total_snapshots, is_active
    FROM companies
    WHERE is_active = TRUE
    ORDER BY last_recorded DESC
  `);
  return rows;
}

module.exports = { registerCompany, getCompanyTable, getAllCompanies };
