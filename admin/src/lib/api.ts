import axios from "axios";

const DEFAULT_ADMIN_BASENAME = "/__admin_portal_93c2f7";

function normalizeBasename(input: string | undefined) {
  const raw = String(input || "").trim();
  if (!raw) return "";
  return raw.startsWith("/") ? raw.replace(/\/$/, "") : `/${raw}`.replace(/\/$/, "");
}

const ADMIN_BASENAME = normalizeBasename(import.meta.env.VITE_ADMIN_BASENAME) || DEFAULT_ADMIN_BASENAME;

const DEFAULT_API_BASE = import.meta.env.DEV
  ? "http://localhost:3001/api"
  : `${window.location.origin}/api`;
const API_BASE = String(import.meta.env.VITE_API_URL || DEFAULT_API_BASE).replace(
  /\/$/,
  "",
);

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        window.dispatchEvent(new CustomEvent("unauthorized"));
      } catch (e) {
        localStorage.removeItem("adminToken");
        window.location.href = `${ADMIN_BASENAME}/login`;
      }
    }
    return Promise.reject(error);
  },
);

export default api;
