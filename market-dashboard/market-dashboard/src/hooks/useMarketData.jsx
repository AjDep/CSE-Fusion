import { useState, useEffect } from "react";
import { fetchTables, fetchTableData ,fetchCompanies,fetchCompanyHistory} from "../api/api";

export function useTables() {
  const [tables, setTables] = useState([]);
  useEffect(() => {
    fetchTables().then(res => setTables(res.data.tables)).catch(console.error);
  }, []);
  return tables;
}

export function useTableData(selectedTable) {
  const [data, setData] = useState([]);
  useEffect(() => {
    if (!selectedTable) return;
    fetchTableData(selectedTable).then(res => setData(res.data)).catch(console.error);
  }, [selectedTable]);
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

