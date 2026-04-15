// services/analysisService.js
const fs = require('fs');
const path = require('path');

class AnalysisService {
  /**
   * Read the LLM analysis report from Python outputs
   */
  async getAnalysisReport() {
    try {
      const reportPath = path.join(
        __dirname,
        '../../MLModels/MergeModels/outputs/analysis_report.txt'
      );

      if (!fs.existsSync(reportPath)) {
        return null; // No analysis report yet
      }

      const report = fs.readFileSync(reportPath, 'utf-8');
      return report;
    } catch (error) {
      console.error('Error reading analysis report:', error);
      throw new Error('Failed to read analysis report');
    }
  }

  /**
   * Read the LLM analysis summary as JSON
   */
  async getAnalysisSummary() {
    try {
      const summaryPath = path.join(
        __dirname,
        '../../MLModels/MergeModels/outputs/analysis_summary.json'
      );

      console.log(`📁 Looking for analysis summary at: ${summaryPath}`);
      console.log(`   File exists: ${fs.existsSync(summaryPath)}`);

      if (!fs.existsSync(summaryPath)) {
        console.warn(`⚠️ Analysis summary file not found. Run ML analysis first.`);
        return null; // No analysis summary yet
      }

      const jsonData = fs.readFileSync(summaryPath, 'utf-8');
      const parsed = JSON.parse(jsonData);
      console.log(`✅ Analysis summary loaded successfully`);
      return parsed;
    } catch (error) {
      console.error('❌ Error reading analysis summary:', error.message);
      throw new Error(`Failed to read analysis summary: ${error.message}`);
    }
  }

  /**
   * Get formatted analysis data suitable for frontend display
   */
  async getFormattedAnalysis() {
    try {
      console.log(`🔍 Attempting to load formatted analysis...`);
      const summary = await this.getAnalysisSummary();

      if (!summary) {
        console.warn(`⚠️ No analysis summary available. User should run ML Insights first.`);
        return {
          available: false,
          message: 'No analysis available yet. Click "Get ML Insights" to run analysis.',
        };
      }

      console.log(`✅ Successfully formatted analysis`);
      return {
        available: true,
        timestamp: summary.timestamp,
        distribution: summary.distribution,
        regimeBreakdown: summary.regime_breakdown,
        topOpportunities: summary.top_opportunities || [],
        buyCandidates: summary.buy_candidates || [],
      };
    } catch (error) {
      console.error('❌ Error formatting analysis:', error.message);
      throw error;
    }
  }

  /**
   * Get both report text and summary JSON
   */
  async getFullAnalysis() {
    try {
      const [report, summary] = await Promise.all([
        this.getAnalysisReport(),
        this.getAnalysisSummary(),
      ]);

      if (!report && !summary) {
        return {
          available: false,
          message: 'No analysis available yet. Run ML analysis first.',
        };
      }

      return {
        available: true,
        report: report,
        summary: summary,
      };
    } catch (error) {
      console.error('Error getting full analysis:', error);
      throw error;
    }
  }
}

module.exports = new AnalysisService();
