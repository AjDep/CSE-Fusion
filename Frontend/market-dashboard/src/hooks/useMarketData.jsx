import { useState, useEffect, useCallback } from "react";
import {
  fetchTables,
  fetchTableData,
  fetchCompanies,
  fetchCompanyHistory,
  syncTableToML,
  runMLAnalysis
} from "../api/api";

export function useTables() {
  const [tables, setTables] = useState([]);
  const loadTables = useCallback(() => {
    return fetchTables()
      .then(res => setTables(res.data.tables || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  return { tables, reloadTables: loadTables };
}

export function useTableData(selectedTable, refreshKey = 0) {
  const [data, setData] = useState([]);
  useEffect(() => {
    if (!selectedTable) return;
    fetchTableData(selectedTable).then(res => setData(res.data)).catch(console.error);
  }, [selectedTable, refreshKey]);
  return data;
}

export function useCompanies() {
  const [companies, setCompanies] = useState([]);
  useEffect(() => {
    fetchCompanies().then(res => setCompanies(res.data.companies)).catch(console.error);
  }, []); 
  return companies;

}

export function useCompanyHistory(security) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!security) {
      setHistory([]);
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setError(null);

    fetchCompanyHistory(security)
      .then(res => {
        if (!isCancelled) setHistory(res.data.data || []);
      })
      .catch(err => {
        if (!isCancelled) {
          console.error(err);
          setError(err);
        }
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [security]);

  return { history, loading, error };
}

export function useMLActions() {
  const [isRunningML, setIsRunningML] = useState(false);
  const [mlStatus, setMlStatus] = useState("");

  const syncTable = async (tableName) => {
    try {
      const response = await syncTableToML(tableName);
      if (response?.data?.message) {
        console.log('[ML] Synced:', response.data.message);
      }
      return response.data;
    } catch (error) {
      console.error('Error syncing table to ML models:', error);
      throw error;
    }
  };

  const runML = async (tableName) => {
    if (!tableName) {
      setMlStatus("Please select a table first");
      return null;
    }

    setIsRunningML(true);
    setMlStatus("Running ML analysis...");

    try {
      const response = await runMLAnalysis(tableName);
      const message = response?.data?.message || 'ML analysis completed';
      setMlStatus(message);
      return response.data;
    } catch (error) {
      const apiMessage = error?.response?.data?.error || 'ML analysis failed';
      setMlStatus(apiMessage);
      return null;
    } finally {
      setIsRunningML(false);
    }
  };

  return { isRunningML, mlStatus, syncTable, runML };
}

