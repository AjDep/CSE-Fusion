// routes/tables.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { asyncHandler } = require('../utils');

router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`SHOW TABLES LIKE 'bid_vs_ask_%'`);
  const key = Object.keys(rows[0] || {})[0];
  const tables = rows.map(r => r[key]);
  res.json({ tables });
}));

module.exports = router;
