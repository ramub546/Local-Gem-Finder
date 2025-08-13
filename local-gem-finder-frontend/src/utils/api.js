// src/utils/api.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const token = localStorage.getItem("token");



export default {
  get: (url, params) => api.get(url, { params }).then(r => r.data),
  post: (url, data) => api.post(url, data).then(r => r.data),
  postForm: (url, formData) =>
    api.post(url, formData, { headers: { "Content-Type": "multipart/form-data" } }).then(r => r.data),
  put: (url, data) => api.put(url, data).then(r => r.data),
  del: (url) => api.delete(url).then(r => r.data),
};
