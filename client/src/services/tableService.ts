import axios from "axios";

const API_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5001") + "/api/tables";

const apiClient = axios.create();

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getTables = async () => {
  const res = await apiClient.get(API_URL);
  return res.data;
};

export const addTable = async (number: string, seats: number) => {
  const res = await apiClient.post(API_URL, { number, seats });
  return res.data;
};

export const updateTableStatus = async (id: string, status: string) => {
  const res = await apiClient.patch(`${API_URL}/${id}`, { status });
  return res.data;
};

export const updateTable = async (
  id: string,
  number?: string,
  seats?: number
) => {
  const res = await apiClient.patch(`${API_URL}/${id}`, { number, seats });
  return res.data;
};

export const deleteTable = async (id: string) => {
  const res = await apiClient.delete(`${API_URL}/${id}`);
  return res.data;
};
