// controllers/tablesController.js
const tablesService = require('../services/tablesService');

class TablesController {
  async getTables(req, res) {
    try {
      const tables = await tablesService.getAllTables();
      res.json({ tables });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tables', details: error.message });
    }
  }
}

module.exports = new TablesController();