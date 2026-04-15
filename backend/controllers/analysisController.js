// controllers/analysisController.js
const analysisService = require('../services/analysisService');

class AnalysisController {
  /**
   * GET /api/analysis/report - Get the full text report
   */
  async getReport(req, res) {
    try {
      const report = await analysisService.getAnalysisReport();

      if (!report) {
        return res.status(404).json({
          available: false,
          message: 'No analysis report available yet. Run ML analysis first.',
        });
      }

      res.json({
        available: true,
        report: report,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch analysis report',
        details: error.message,
      });
    }
  }

  /**
   * GET /api/analysis/summary - Get the structured JSON summary
   */
  async getSummary(req, res) {
    try {
      const summary = await analysisService.getAnalysisSummary();

      if (!summary) {
        return res.status(404).json({
          available: false,
          message: 'No analysis summary available yet. Run ML analysis first.',
        });
      }

      res.json({
        available: true,
        data: summary,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch analysis summary',
        details: error.message,
      });
    }
  }

  /**
   * GET /api/analysis - Get formatted analysis for dashboard
   */
  async getFormattedAnalysis(req, res) {
    try {
      console.log(`📨 [GET /api/analysis] Request received`);
      const analysis = await analysisService.getFormattedAnalysis();
      console.log(`✅ [GET /api/analysis] Sending response:`, analysis);
      res.json(analysis);
    } catch (error) {
      console.error(`❌ [GET /api/analysis] Error:`, error.message);
      res.status(500).json({
        available: false,
        message: error.message,
        error: 'Failed to fetch analysis',
      });
    }
  }

  /**
   * GET /api/analysis/full - Get both report and summary
   */
  async getFullAnalysis(req, res) {
    try {
      const analysis = await analysisService.getFullAnalysis();
      res.json(analysis);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch full analysis',
        details: error.message,
      });
    }
  }
}

module.exports = new AnalysisController();
