import axios from "axios";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

export const axiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// 🔥 ADD THIS
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
