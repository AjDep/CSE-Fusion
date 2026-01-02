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

  async analyzeBidDominance(req, res) {
    try {
      const { orderbooks } = req.body; // array of { security, totalBid, totalAsk, bids, asks }
      const results = [];

      for (const ob of orderbooks) {
        const { security, totalBid, totalAsk, bids, asks } = ob;

        if (isNaN(totalAsk) || isNaN(totalBid) || !bids || bids.length === 0) continue;

        const totalBidSplits = bids.reduce((s, b) => s + (parseInt(b.splits || 0) || 0), 0);
        const totalAskSplits = asks ? asks.reduce((s, a) => s + (parseInt(a.splits || 0) || 0), 0) : 0;

        if (totalBid >= totalAsk) {
          const { diffPercent, topBidEntry } = bidAskService.calculateBidDominance(totalBid, totalAsk, bids);
          results.push({
            security,
            totalAsk,
            totalBid,
            diffPercent,
            topBidPrice: topBidEntry.price || "N/A",
            topBidQty: topBidEntry.qty || 0,
            currentBidPrice: bids[0]?.price || "N/A",
            totalBidSplits,
            totalAskSplits
          });
        }
      }

      results.sort((a, b) => (b.diffPercent - a.diffPercent) || (b.totalBidSplits - a.totalBidSplits));
      res.json({ results });
    } catch (error) {
      res.status(500).json({ error: 'Failed to analyze bid dominance', details: error.message });
    }
  }
}

module.exports = new BidAskController();