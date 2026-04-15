// routes/analysis.js
const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const { asyncHandler } = require('../utils');

// GET analysis endpoints
router.get('/', asyncHandler(analysisController.getFormattedAnalysis));
router.get('/report', asyncHandler(analysisController.getReport));
router.get('/summary', asyncHandler(analysisController.getSummary));
router.get('/full', asyncHandler(analysisController.getFullAnalysis));

module.exports = router;
