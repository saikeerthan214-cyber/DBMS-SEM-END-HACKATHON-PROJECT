import axios from 'axios';

// In development: Vite proxy forwards /api/* → localhost:8082, /node/* → localhost:3001
// In production (Render): VITE_API_BASE and VITE_NODE_BASE are set to the deployed service URLs
const BASE_URL = import.meta.env.VITE_API_BASE || '/api';
const NODE_URL = import.meta.env.VITE_NODE_BASE || '/node';

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

export const getItemById = (id) =>
  axios.get(`${BASE_URL}/items/${id}`);

export const searchItems = (keyword) =>
  axios.get(`${BASE_URL}/items/search`, { params: { keyword } });

export const searchItemsByCategory = (keyword, categoryId) =>
  axios.get(`${BASE_URL}/items/search`, {
    params: { keyword, categoryId },
  });

export const searchItemsWithFilters = (keyword, categoryId, minPrice, maxPrice) =>
  axios.get(`${BASE_URL}/items/search`, {
    params: { keyword, categoryId, minPrice, maxPrice },
  });

export const addItem = (item) =>
  axios.post(`${BASE_URL}/items`, item);

export const updateItem = (id, item) =>
  axios.put(`${BASE_URL}/items/${id}`, item);

export const deleteItem = (id) =>
  axios.delete(`${BASE_URL}/items/${id}`);

// ── Categories ────────────────────────────────────────────────────────────────

export const getAllCategories = () =>
  axios.get(`${BASE_URL}/categories`);

export const addCategory = (category) =>
  axios.post(`${BASE_URL}/categories`, category);

export const deleteCategory = (id) =>
  axios.delete(`${BASE_URL}/categories/${id}`);

// ── Users (Admin) ─────────────────────────────────────────────────────────────

export const getAllUsers = () =>
  axios.get(`${BASE_URL}/users`);

export const deleteUser = (id) =>
  axios.delete(`${BASE_URL}/users/${id}`);

// ── Node.js — Search Logs (PostgreSQL) ───────────────────────────────────────

export const logSearch = (keyword, username, results) =>
  axios.post(`${NODE_URL}/search-logs`, { keyword, username, results });

export const getSearchLogs = () =>
  axios.get(`${NODE_URL}/search-logs`);

export const getTrending = () =>
  axios.get(`${NODE_URL}/trending`);

export const getAnalytics = () =>
  axios.get(`${NODE_URL}/analytics`);

export const deleteSearchLog = (id) =>
  axios.delete(`${NODE_URL}/search-logs/${id}`);

// ── Node.js — Reviews (MongoDB) ───────────────────────────────────────────────

export const getReviews = (itemId) =>
  axios.get(`${NODE_URL}/reviews`, { params: itemId ? { itemId } : {} });

export const addReview = (review) =>
  axios.post(`${NODE_URL}/reviews`, review);

export const deleteReview = (id) =>
  axios.delete(`${NODE_URL}/reviews/${id}`);

// ── Node.js — Saved Items (MongoDB) ───────────────────────────────────────────

export const getSavedItems = (username) =>
  axios.get(`${NODE_URL}/saved-items/${username}`);

export const saveItem = (data) =>
  axios.post(`${NODE_URL}/saved-items`, data);

export const unsaveItem = (id) =>
  axios.delete(`${NODE_URL}/saved-items/${id}`);

// ── Node.js — User Activity (MongoDB) ────────────────────────────────────────

export const getUserActivity = (username) =>
  axios.get(`${NODE_URL}/activity/${username}`);

export const logActivity = (data) =>
  axios.post(`${NODE_URL}/activity`, data);
