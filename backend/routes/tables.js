// routes/tables.js
const express = require('express');
const router = express.Router();
const tablesController = require('../controllers/tablesController');
const { asyncHandler } = require('../utils');

router.get('/', asyncHandler(tablesController.getTables));

module.exports = router;
