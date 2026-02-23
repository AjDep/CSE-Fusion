import React, { useState, useMemo, useEffect } from "react";
import { useTables, useTableData, useCompanies, useCompanyHistory, useMLActions } from "../hooks/useMarketData";
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
  const { tables, reloadTables } = useTables();
  const [selectedTable, setSelectedTable] = useState("");
  const data = useTableData(selectedTable);
  const companies = useCompanies();
  const [selectedCompany, setSelectedCompany] = useState("");
  const { history: companyHistory, loading } = useCompanyHistory(selectedCompany); // Custom hook
  const { isRunningML, mlStatus, syncTable, runML } = useMLActions();
  const [showML, setShowML] = useState(false);
  const [mlRefresh, setMlRefresh] = useState(0);
  const mlData = useTableData(showML ? 'ml_trading_signals' : '', mlRefresh);

  // Auto-select the most recent bid/ask table (fallback to any table) so data shows immediately
  useEffect(() => {
    if (!selectedTable && tables.length > 0) {
      const nonMlTables = tables.filter(t => t !== 'ml_trading_signals');
      const fallbackTables = nonMlTables.length > 0 ? nonMlTables : tables;
      setSelectedTable(fallbackTables[fallbackTables.length - 1]);
    }
  }, [selectedTable, tables]);

  // Sync selected table to ML models when it changes
  useEffect(() => {
    if (selectedTable) {
      syncTable(selectedTable);
    }
  }, [selectedTable, syncTable]);

  const displayTableName = useMemo(() => formatTableName(selectedTable), [selectedTable]);

  const handleRunML = async () => {
    const result = await runML(selectedTable);
    if (result?.success) {
      await reloadTables();
      setShowML(true);
      setMlRefresh((n) => n + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-4">MARKET MONITOR DASHBOARD</h1>

      <div className="dropdowns">
        <div className="table-selector">
          <TableSelector tables={tables} value={selectedTable} onChange={setSelectedTable} />
        </div>
        <div className="company-selector">
          <CompanySearchBar setResults={setSelectedCompany}/>
        </div>
        <div className="MLBtn">
          <button
          onClick={handleRunML}
          disabled={isRunningML || !selectedTable}
          className={`px-4 py-2 rounded font-semibold transition ${
            isRunningML || !selectedTable
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isRunningML ? (
            <span className="flex items-center gap-2">
              <span className="ml-spinner" aria-hidden="true" />
              <span>Running...</span>
            </span>
          ) : (
            'Get ML Insights'
          )}
        </button>
        </div>
        {mlStatus && (
          <p className="text-sm font-semibold">{mlStatus}</p>
      )}
     
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
            
          {showML && mlData.length > 0 && (
             <div className="mt-6 bg-white p-4 rounded shadow">
                <h3 className="text-lg font-semibold mb-2">ML Trading Signals</h3>
                <DataTable data={mlData} />
              </div>
            )}

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
