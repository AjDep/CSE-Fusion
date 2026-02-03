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
      
          const { diffPercent, topBidEntry } = bidAskService.calculateBidDominance(totalBid, totalAsk, bids);
          const pplDominance = bidAskService.calculatePplDominance(totalBidSplits, totalAskSplits);
          results.push({
            security,
            totalAsk,
            totalBid,
            diffPercent,
            pplDominance,
            topBidPrice: topBidEntry.price || null,
            topBidQty: topBidEntry.qty || 0,
            currentBidPrice: bids[0]?.price || null,
            totalBidSplits,
            totalAskSplits
          });
        
      }

      results.sort((a, b) => (b.diffPercent - a.diffPercent) || (b.totalBidSplits - a.totalBidSplits));
      res.json({ results });
    } catch (error) {
      res.status(500).json({ error: 'Failed to analyze bid dominance', details: error.message });
    }
  }

  async syncTableToML(req, res) {
    try {
      const { tableName } = req.body;
      
      if (!tableName) {
        return res.status(400).json({ error: 'tableName is required' });
      }

      // Write the selected table to the ML models' config
      const fs = require('fs');
      const path = require('path');
      
      // Path to the ML models' config
      const configPath = path.join(__dirname, '../../MLModels/selected_table.json');
      
      // Create the directory if it doesn't exist
      const configDir = path.dirname(configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      // Write the selected table to JSON
      fs.writeFileSync(configPath, JSON.stringify({ table_name: tableName }, null, 2));
      
      res.json({ 
        success: true, 
        message: `ML models synced to use table: ${tableName}` 
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to sync table to ML models', details: error.message });
    }
  }

  async runMLAnalysis(req, res) {
    try {
      const { tableName } = req.body;
      
      if (!tableName) {
        return res.status(400).json({ error: 'tableName is required' });
      }

      // Sync the table first
      const fs = require('fs');
      const path = require('path');
      const configPath = path.join(__dirname, '../../MLModels/selected_table.json');
      fs.writeFileSync(configPath, JSON.stringify({ table_name: tableName }, null, 2));

      // Run the Python ML analysis script
      const { spawn } = require('child_process');
      const pythonScript = path.join(__dirname, '../../MLModels/MergeModels/run_fusion.py');
      
      return new Promise((resolve, reject) => {
        const python = spawn('python', [pythonScript], {
          cwd: path.dirname(pythonScript),
          stdio: 'pipe'
        });

        let output = '';
        let error = '';

        python.stdout.on('data', (data) => {
          output += data.toString();
          console.log(`ML Output: ${data}`);
        });

        python.stderr.on('data', (data) => {
          error += data.toString();
          console.error(`ML Error: ${data}`);
        });

        python.on('close', (code) => {
          if (code === 0) {
            res.json({
              success: true,
              message: `ML analysis completed successfully for table: ${tableName}`,
              output: output
            });
          } else {
            res.status(500).json({
              error: 'ML analysis failed',
              details: error || 'Unknown error',
              code: code
            });
          }
        });

        python.on('error', (err) => {
          res.status(500).json({
            error: 'Failed to start ML analysis',
            details: err.message
          });
        });
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to run ML analysis', details: error.message });
    }
  }
}

module.exports = new BidAskController();