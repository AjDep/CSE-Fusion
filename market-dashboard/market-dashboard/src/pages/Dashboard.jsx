import React, { useState, useMemo, useEffect } from "react";
import { useTables, useTableData, useCompanies, useCompanyHistory } from "../hooks/useMarketData";
import LineDiffChart from "../components/charts/lineDiffChart";
import BidAskChart from "../components/charts/BidAskChart";
import TableSelector from "../components/TableSelector";
import DataTable from "../components/DataTable";
import CompanySelctor from "../components/CompanySelector";
import CompanyHistoryChart from "../components/charts/companyChart";
import "./Dashboard.css";
import CompanySearchBar from "../components/CompanySearchBar";

// helper to format table names like "bid_vs_ask_2025_11_03_01"
const formatTableName = (name) => {
  if (!name) return "";
  const parts = name.split("_");
  const dateIndex = parts.findIndex((p) => /^\d{4}$/.test(p));
  const labelParts = dateIndex > 0 ? parts.slice(0, dateIndex) : parts.slice(0, 3);
  const label = labelParts
    .map((w) => w.toLowerCase())
    .map((w) => (w === "vs" ? "vs" : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
  if (dateIndex === -1) return label || name.replace(/_/g, " ");
  const dateParts = parts.slice(dateIndex);
  const date =
    dateParts.length >= 3
      ? `${dateParts[0]}-${dateParts[1].padStart(2, "0")}-${dateParts[2].padStart(2, "0")}`
      : dateParts.join("-");
  const suffix = dateParts[3] ? ` ${dateParts[3]}` : "";
  return `${label} — ${date}${suffix}`;
};

export default function Dashboard() {
  const tables = useTables();
  const [selectedTable, setSelectedTable] = useState("");
  const data = useTableData(selectedTable);
  const companies = useCompanies();
  const [selectedCompany, setSelectedCompany] = useState("");
  const { history: companyHistory, loading } = useCompanyHistory(selectedCompany); // Custom hook
  const [isRunningML, setIsRunningML] = useState(false);
  const [mlStatus, setMlStatus] = useState("");

  // Sync selected table to ML models when it changes
  useEffect(() => {
    if (selectedTable) {
      syncTableToML(selectedTable);
    }
  }, [selectedTable]);

  const displayTableName = useMemo(() => formatTableName(selectedTable), [selectedTable]);

  // Function to sync selected table to ML models backend
  const syncTableToML = async (tableName) => {
    try {
      const response = await fetch('http://localhost:5000/api/sync-table-to-ml', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tableName }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ ML models synced:', result.message);
      } else {
        console.error('Failed to sync table to ML models');
      }
    } catch (error) {
      console.error('Error syncing table to ML models:', error);
    }
  };

  // Function to run ML analysis
  const runMLAnalysis = async () => {
    if (!selectedTable) {
      setMlStatus("❌ Please select a table first");
      return;
    }

    setIsRunningML(true);
    setMlStatus("🔄 Running ML analysis...");

    try {
      const response = await fetch('http://localhost:5000/api/run-ml-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tableName: selectedTable }),
      });

      if (response.ok) {
        const result = await response.json();
        setMlStatus(`✅ ${result.message}`);
        console.log('ML Analysis complete:', result);
      } else {
        const error = await response.json();
        setMlStatus(`❌ ML analysis failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Error running ML analysis:', error);
      setMlStatus("❌ Error running ML analysis");
    } finally {
      setIsRunningML(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-4">MARKET MONITOR DASHBOARD</h1>

      <div className="dropdowns">
      <div className="flex justify-center mb-4 gap-4">
        <TableSelector tables={tables} value={selectedTable} onChange={setSelectedTable} />
        <button
          onClick={runMLAnalysis}
          disabled={isRunningML || !selectedTable}
          className={`px-4 py-2 rounded font-semibold transition ${
            isRunningML || !selectedTable
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isRunningML ? '⏳ Running...' : '🤖 Get ML Insights'}
        </button>
      </div>

      {mlStatus && (
        <div className="flex justify-center mb-4">
          <p className="text-sm font-semibold">{mlStatus}</p>
        </div>
      )}

      <div className="flex justify-center mb-4">
        <CompanySearchBar setResults={setSelectedCompany}/>
      </div>
      </div>
      {data.length > 0 && (
        <>
        <div className="posistion">
          <div className="Table mt-6 bg-white p-4 rounded shadow">
              <h3 className="text-xl font-semibold text-center mb-2">{displayTableName}</h3>
            <DataTable data={data} />
          </div>

          
          <div className="lineDiff grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold mb-2">BID-ASK SPREAD VS. BUYER-SELLER RATIO</h3>
              <LineDiffChart data={data} />
            </div>
            <div className="bg-white p-4 rounded shadow">
                <h3 className="text-lg font-semibold mb-2">BID VS ASK PEOPLE</h3>
                <BidAskChart data={[...data].sort((a, b) => {
                  const bidA = Number(a.total_bid_splits) || 0;
                  const bidB = Number(b.total_bid_splits) || 0;
                  return bidB - bidA;
                })} />
              </div>
            </div>
          </div>
            
          

          {selectedCompany && (
            <div className="mt-6 bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold mb-2">{selectedCompany} — History</h3>
              {loading ? (
                <p>Loading company history...</p>
              ) : (
                <CompanyHistoryChart data={companyHistory || []} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
