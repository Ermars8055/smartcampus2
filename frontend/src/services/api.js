import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';


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
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Forward compatibility for Nginx reverse proxy:
  // Ensure that static upload URLs go through the /api/ route
  if (normalizedPath.startsWith('/uploads')) {
     normalizedPath = `/api${normalizedPath}`;
  }

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
