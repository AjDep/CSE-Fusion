import React, { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../api/config";
import "./AnalysisPanel.css";

export default function AnalysisPanel() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        console.log("🔍 Fetching analysis from:", API_ENDPOINTS.analysis);
        
        const response = await fetch(API_ENDPOINTS.analysis);
        console.log("📡 Response status:", response.status);
        
        const data = await response.json();
        console.log("📦 Response data:", data);

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} - ${data.error || 'Unknown error'}`);
        }

        if (data.available) {
          setAnalysis(data);
          setError(null);
          setLastFetch(new Date().toLocaleTimeString());
        } else {
          setAnalysis(null);
          setError(data.message || "No analysis available yet. Run ML Insights first.");
          console.warn("⚠️ Analysis not available:", data.message);
        }
      } catch (err) {
        console.error("❌ Error fetching analysis:", err);
        setError(`Error: ${err.message}`);
        setAnalysis(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAnalysis, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="analysis-panel-container">
        <div className="analysis-panel-loading">
          <div className="spinner"></div>
          <p>Loading analysis...</p>
          <small>Connecting to {API_ENDPOINTS.analysis}</small>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="analysis-panel-container">
        <div className="analysis-panel-error">
          <p>📊 {error || "No analysis available yet"}</p>
          <small style={{ marginTop: "8px", opacity: 0.8, display: "block" }}>
            API: {API_ENDPOINTS.analysis}
            {lastFetch && <><br />Last fetch: {lastFetch}</>}
          </small>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: "12px",
              padding: "8px 16px",
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "white",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.9rem"
            }}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  const dist = analysis.distribution || {};
  const regime = analysis.regimeBreakdown || {};
  const topOpportunities = analysis.topOpportunities || [];
  const buyCandidates = analysis.buyCandidates || [];

  return (
    <div className="analysis-panel-container">
      <div className="analysis-panel-header">
        <h2 className="analysis-panel-title">
          🤖 AI SIGNAL ANALYSIS
        </h2>
        <button
          className="analysis-panel-toggle"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "−" : "+"}
        </button>
      </div>

      {expanded && (
        <div className="analysis-panel-content">
          {/* Signal Distribution */}
          <div className="analysis-section">
            <h3 className="analysis-section-title">📊 Signal Distribution</h3>
            <div className="distribution-grid">
              <div className="signal-stat buy">
                <div className="stat-icon">🟢</div>
                <div className="stat-details">
                  <div className="stat-label">BUY Signals</div>
                  <div className="stat-value">
                    {dist.buy_count} ({dist.buy_pct}%)
                  </div>
                </div>
              </div>

              <div className="signal-stat strong-buy">
                <div className="stat-icon">⭐</div>
                <div className="stat-details">
                  <div className="stat-label">STRONG BUY</div>
                  <div className="stat-value">
                    {dist.strong_buy_count}
                    {dist.strong_buy_count > 0 && " 🔥"}
                  </div>
                </div>
              </div>

              <div className="signal-stat sell">
                <div className="stat-icon">🔻</div>
                <div className="stat-details">
                  <div className="stat-label">SELL Signals</div>
                  <div className="stat-value">
                    {dist.sell_count} ({dist.sell_pct}%)
                  </div>
                </div>
              </div>

              <div className="signal-stat hold">
                <div className="stat-icon">⚖️</div>
                <div className="stat-details">
                  <div className="stat-label">HOLD</div>
                  <div className="stat-value">
                    {dist.hold_count} ({dist.hold_pct}%)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Market Regimes */}
          <div className="analysis-section">
            <h3 className="analysis-section-title">📈 Market Regimes</h3>
            <div className="regime-list">
              {Object.entries(regime).length > 0 ? (
                Object.entries(regime).map(([regimeName, count]) => (
                  <div key={regimeName} className="regime-item">
                    <span className="regime-name">{regimeName}</span>
                    <span className="regime-count">{count} securities</span>
                  </div>
                ))
              ) : (
                <p className="no-data">No regime data available</p>
              )}
            </div>
          </div>

          {/* Top Opportunities */}
          {topOpportunities.length > 0 && (
            <div className="analysis-section">
              <h3 className="analysis-section-title">
                🌟 Top Opportunities (Strong Buy)
              </h3>
              <div className="opportunities-list">
                {topOpportunities.slice(0, 5).map((opp, idx) => (
                  <div key={idx} className="opportunity-item">
                    <div className="opportunity-icon">⭐</div>
                    <div className="opportunity-info">
                      <div className="opportunity-security">{opp.security}</div>
                      <div className="opportunity-regime">{opp.regime}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buy Candidates */}
          {buyCandidates.length > 0 && (
            <div className="analysis-section">
              <h3 className="analysis-section-title">
                📈 Buy Candidates
              </h3>
              <div className="candidates-list">
                {buyCandidates.slice(0, 5).map((cand, idx) => (
                  <div key={idx} className="candidate-item">
                    <div className="candidate-icon">🟢</div>
                    <div className="candidate-info">
                      <div className="candidate-security">{cand.security}</div>
                      <div className="candidate-regime">{cand.regime}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="analysis-footer">
            <small>
              Last updated: {new Date(analysis.timestamp).toLocaleString()}
            </small>
          </div>
        </div>
      )}
    </div>
  );
}
