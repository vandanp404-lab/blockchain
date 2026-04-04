import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.message ||
      "An unexpected error occurred";
    return Promise.reject(new Error(message));
  }
);

// ── Health ────────────────────────────────────
export const checkHealth = () => api.get("/health");

// ── Config ───────────────────────────────────
export const getConfig = () => api.get("/config");

// ── Products ──────────────────────────────────
export const getProducts = () => api.get("/products");
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post("/products", data);

// ── Tracking ──────────────────────────────────
export const getTrackingHistory = (productId) =>
  api.get(`/products/${productId}/tracking`);

export const updateTracking = (productId, data) =>
  api.post(`/products/${productId}/tracking`, data);

// ── Participants ──────────────────────────────
export const getParticipant = (address) =>
  api.get(`/participants/${address}`);

export const registerParticipant = (data) =>
  api.post("/participants", data);

// ── Verification ──────────────────────────────
export const verifyProduct = (sku) => api.get(`/verify/${sku}`);

// ── Reports ───────────────────────────────────
export const getAnalytics = () => api.get("/reports/analytics");

export default api;
