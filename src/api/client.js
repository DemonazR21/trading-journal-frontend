import axios from 'axios';
import keycloak from '../keycloak';

// API base URL from environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  (config) => {
    if (keycloak.token) {
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshed = await keycloak.updateToken(30);
        if (refreshed) {
          originalRequest.headers.Authorization = `Bearer ${keycloak.token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        keycloak.login();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// API methods
export const api = {
  // Signals
  getSignals: (params = {}) => apiClient.get('/signals', { params }),
  getSignal: (id) => apiClient.get(`/signals/${id}`),

  // Trades
  getTrades: (params = {}) => apiClient.get('/trades', { params }),
  getTrade: (id) => apiClient.get(`/trades/${id}`),
  createTrade: (data) => apiClient.post('/trades', data),
  updateTrade: (id, data) => apiClient.put(`/trades/${id}`, data),
  deleteTrade: (id) => apiClient.delete(`/trades/${id}`),

  // Stats
  getStats: () => apiClient.get('/stats'),

  // User
  getCurrentUser: () => apiClient.get('/user'),

  // Bot Config
  getBotConfigs: () => apiClient.get('/bot-config'),
  updateBotConfig: (botName, data) => apiClient.put(`/bot-config/${botName}`, data),
  getBotTrades: (params = {}) => apiClient.get('/bot-trades', { params }),
  getBotKeys: (botName) => apiClient.get(`/bot-config/${botName}/keys`),
  saveBotKeys: (botName, data) => apiClient.put(`/bot-config/${botName}/keys`, data),
  getBotStats: (params = {}) => apiClient.get('/bot-stats', { params }),
};
