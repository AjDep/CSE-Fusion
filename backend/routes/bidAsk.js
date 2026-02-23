// routes/bidAsk.js
const express = require('express');
const router = express.Router();
const bidAskController = require('../controllers/bidAskController');
const { asyncHandler } = require('../utils');

// POST: Store bid-ask analysis
router.post('/store-bid-ask', asyncHandler(bidAskController.storeBidAsk));

// POST: Analyze bid dominance
router.post('/analyze-bid-dominance', asyncHandler(bidAskController.analyzeBidDominance));

// POST: Sync selected table to ML models
router.post('/sync-table-to-ml', asyncHandler(bidAskController.syncTableToML));

// POST: Run ML analysis
router.post('/run-ml-analysis', (req, res, next) => {
  console.log('🔥 ML Analysis route hit!', req.body);
  next();
}, asyncHandler(bidAskController.runMLAnalysis));

// GET: Company history
router.get('/history/:security', asyncHandler(bidAskController.getCompanyHistory));

// GET: Master companies list
router.get('/companies/list', asyncHandler(bidAskController.getCompaniesList));

// GET: Fetch data from specific table
router.get('/:tableName', asyncHandler(bidAskController.getTableData));

module.exports = router;
