// routes/bidAsk.js
const express = require('express');
const router = express.Router();
const bidAskController = require('../controllers/bidAskController');
const { asyncHandler } = require('../utils');

// POST: Store bid-ask analysis
router.post('/store-bid-ask', asyncHandler(bidAskController.storeBidAsk));

// GET: Fetch data from specific table
router.get('/:tableName', asyncHandler(bidAskController.getTableData));

// GET: Company history
router.get('/history/:security', asyncHandler(bidAskController.getCompanyHistory));

// GET: Master companies list
router.get('/companies/list', asyncHandler(bidAskController.getCompaniesList));

module.exports = router;
