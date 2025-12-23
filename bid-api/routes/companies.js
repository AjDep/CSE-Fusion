// routes/companies.js
const express = require('express');
const router = express.Router();
const companiesController = require('../controllers/companiesController');
const { asyncHandler } = require('../utils');

// GET all active companies
router.get('/', asyncHandler(companiesController.getCompanies));

// GET history of a specific company
router.get('/:security', asyncHandler(companiesController.getCompanyHistory));

module.exports = router;
