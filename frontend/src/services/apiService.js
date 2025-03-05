import axios from 'axios';
import { getAuthToken, removeAuthToken } from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Auto logout if 401 response returned from api
      removeAuthToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const login = (email, password) => {
  const formData = new FormData();
  formData.append('username', email);
  formData.append('password', password);
  
  return apiClient.post('/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
};

export const checkAuthStatus = () => apiClient.get('/users/me');

export const startTelegramAuth = (phone) => apiClient.post('/auth/telegram-auth', { phone });

export const confirmTelegramAuth = (authId, code) => {
  return apiClient.post('/auth/telegram-auth-confirm', { auth_id: authId, code });
};

// Messages API
export const getMessages = (params) => apiClient.get('/messages', { params });

export const getUnrespondedMessages = (params) => apiClient.get('/messages/unresponded', { params });

export const getMessage = (id) => apiClient.get(`/messages/${id}`);

export const updateMessage = (id, data) => apiClient.put(`/messages/${id}`, data);

export const respondToMessage = (id, responseText) => {
  return apiClient.post(`/messages/${id}/respond`, { response_text: responseText });
};

// Contacts API
export const getContacts = (params) => apiClient.get('/contacts', { params });

export const getContact = (id) => apiClient.get(`/contacts/${id}`);

export const getContactWithMessages = (id, params) => {
  return apiClient.get(`/contacts/${id}/with-messages`, { params });
};

export const updateContact = (id, data) => apiClient.put(`/contacts/${id}`, data);

export const createContact = (data) => apiClient.post('/contacts', data);

// ML API
export const predictMessageCategory = (messageId) => {
  return apiClient.post('/ml/predict', { message_id: messageId });
};

export const submitMLFeedback = (messageId, correctCategory) => {
  return apiClient.post('/ml/feedback', { 
    message_id: messageId, 
    correct_category: correctCategory 
  });
};

export const getMLStats = () => apiClient.get('/ml/stats');

export const retrainModel = () => apiClient.post('/ml/retrain');

/**
 * Request AI categorization for a message
 * @param {number} messageId - ID of the message to categorize
 * @returns {Promise} - The API response
 */
export async function categorizeMessage(messageId) {
  return await axios.post(`${API_URL}/messages/${messageId}/categorize`);
} 