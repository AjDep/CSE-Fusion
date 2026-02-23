// controllers/companiesController.js
const companiesService = require('../services/companiesService');

class CompaniesController {
  async getCompanies(req, res) {
    try {
      const companies = await companiesService.getAllActiveCompanies();
      res.json({ count: companies.length, companies });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch companies', details: error.message });
    }
  }

  async getCompanyHistory(req, res) {
    try {
      const { security } = req.params;
      const { startDate, endDate, limit } = req.query;

      const result = await companiesService.getCompanyHistory(security.toUpperCase(), { startDate, endDate, limit });
      res.json(result);
    } catch (error) {
      if (error.message === 'Company not found') {
        return res.status(404).json({ error: 'Company not found' });
      }
      res.status(500).json({ error: 'Failed to fetch company history', details: error.message });
    }
  }
}

module.exports = new CompaniesController();