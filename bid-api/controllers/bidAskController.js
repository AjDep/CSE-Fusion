// controllers/bidAskController.js
const bidAskService = require('../services/bidAskService');

class BidAskController {
  async storeBidAsk(req, res) {
    try {
      const { records, date } = req.body;
      const result = await bidAskService.storeBidAskData(records, date);
      res.json(result);
    } catch (error) {
      if (error.message === 'No records provided' || error.message === 'Invalid date') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to store bid-ask data', details: error.message });
    }
  }

  async getTableData(req, res) {
    try {
      const { tableName } = req.params;
      const data = await bidAskService.getTableData(tableName);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch table data', details: error.message });
    }
  }

  async getCompanyHistory(req, res) {
    try {
      const { security } = req.params;
      const data = await bidAskService.getCompanyHistory(security.toUpperCase());
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch company history', details: error.message });
    }
  }

  async getCompaniesList(req, res) {
    try {
      const companies = await bidAskService.getAllCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch companies list', details: error.message });
    }
  }
}

module.exports = new BidAskController();