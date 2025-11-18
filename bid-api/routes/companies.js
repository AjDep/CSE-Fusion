// routes/companies.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { asyncHandler } = require('../utils');

// GET all active companies
router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT security, company_name, exchange, 
           first_recorded, last_recorded, total_snapshots, is_active
    FROM companies
    WHERE is_active = TRUE
    ORDER BY last_recorded DESC
  `);
  res.json({ count: rows.length, companies: rows });
}));

// GET history of a specific company
router.get('/:security', asyncHandler(async (req, res) => {
  const security = req.params.security.toUpperCase();
  const { startDate, endDate, limit } = req.query;

  // get table name from companies registry
  const [companyRows] = await pool.query(
    'SELECT table_name FROM companies WHERE security = ?',
    [security]
  );

  if (companyRows.length === 0) {
    return res.status(404).json({ error: 'Company not found' });
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
  res.json({ security, count: rows.length, data: rows });
}));

module.exports = router;
