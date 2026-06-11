import axios from 'axios';

// Prefer the explicit environment variable when set.
// When running the frontend from localhost on a different machine,
// use the backend host IP instead of localhost:8007.
const API_BASE = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:8007'
    : (window.location.hostname.includes('eastpoint.com')
      ? '' // Leave this empty for production
      : `${window.location.protocol}//${window.location.hostname}:8007`));


const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

/**
 * Returns the full URL for a file stored on the backend.
 * @param {string} path - The relative path of the file (e.g., /uploads/...)
 * @returns {string} - The full URL
 */
export const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // Ensure the path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
};

// Add auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const activeSiteId = localStorage.getItem('activeSiteId');
  if (activeSiteId) {
    config.headers['X-Site-Id'] = activeSiteId;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('activeSiteId');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
