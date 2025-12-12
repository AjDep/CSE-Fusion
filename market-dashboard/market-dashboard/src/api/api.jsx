import axios from "axios";

const API_BASE = "http://localhost:5000/api";

export const fetchTables = () => axios.get(`${API_BASE}/tables`);
export const fetchTableData = (table) => axios.get(`${API_BASE}/${table}`);
export const fetchCompanies = () => axios.get(`${API_BASE}/companies`);
export function fetchCompanyHistory(security) {
  return axios.get(`${API_BASE}/companies/${encodeURIComponent(security)}`);
}