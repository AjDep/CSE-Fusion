// routes/bidAsk.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { asyncHandler } = require('../utils');

router.get('/:tableName', asyncHandler(async (req, res) => {
  const { tableName } = req.params;
  const [rows] = await pool.query(`SELECT * FROM \`${tableName}\``);
  res.json(rows);
}));

module.exports = router;
