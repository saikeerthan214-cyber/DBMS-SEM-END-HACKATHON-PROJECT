import axios from 'axios';

// Use relative URL — Vite proxy forwards /api/* to http://localhost:8080
// This eliminates all CORS issues completely
const BASE_URL = '/api';

// ── Request interceptor: attach JWT token ─────────────────────────────────────
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: auto logout on 401 (token expired) ─────────────────
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────

export const loginUser = (credentials) =>
  axios.post(`${BASE_URL}/auth/login`, credentials);

export const registerUser = (userData) =>
  axios.post(`${BASE_URL}/auth/register`, userData);

// ── Items ─────────────────────────────────────────────────────────────────────

export const getAllItems = () =>
  axios.get(`${BASE_URL}/items`);

export const searchItems = (keyword) =>
  axios.get(`${BASE_URL}/items/search`, { params: { keyword } });

export const searchItemsByCategory = (keyword, categoryId) =>
  axios.get(`${BASE_URL}/items/search`, {
    params: { keyword, categoryId },
  });

export const addItem = (item) =>
  axios.post(`${BASE_URL}/items`, item);

export const deleteItem = (id) =>
  axios.delete(`${BASE_URL}/items/${id}`);

// ── Categories ────────────────────────────────────────────────────────────────

export const getAllCategories = () =>
  axios.get(`${BASE_URL}/categories`);

export const addCategory = (category) =>
  axios.post(`${BASE_URL}/categories`, category);

export const deleteCategory = (id) =>
  axios.delete(`${BASE_URL}/categories/${id}`);
