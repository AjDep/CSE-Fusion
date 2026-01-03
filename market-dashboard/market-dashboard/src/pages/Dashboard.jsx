import React, { useState, useMemo } from "react";
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


  const enhancedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((row, index) => {
      const totalBidppl = parseFloat(row.total_bid_splits) || 0;
      const totalAskppl = parseFloat(row.total_ask_splits) || 0;
      const dominanceOfppl = totalBidppl + totalAskppl > 0 ? ((totalBidppl - totalAskppl) / (totalBidppl + totalAskppl)) * 100 : 0;
      return { ...row, id: index + 1, bid_dominance: dominanceOfppl.toFixed(2) };
    });
  }, [data]);

  const displayTableName = useMemo(() => formatTableName(selectedTable), [selectedTable]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-4">MARKET MONITOR DASHBOARD</h1>

      <div className="dropdowns">
      <div className="flex justify-center mb-4">
        <TableSelector tables={tables} value={selectedTable} onChange={setSelectedTable} />
      </div>

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
              <BidAskChart data={data} />
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
