import axios from 'axios';
import Cookies from 'js-cookie';
import { VendorId } from './vendors';

// Use relative URLs to leverage the nginx proxy
const API_URL = '/api';

interface ApiKey {
  id: string;
  name: string;
  vendor: VendorId;
  createdAt: string;
  lastUsedAt: string | null;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use((config) => {
  // Check cookies first (preferred), then localStorage as fallback
  const token = Cookies.get('token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Add CSRF token from cookie if present
  const xsrfToken = Cookies.get('XSRF-TOKEN');
  if (xsrfToken) {
    config.headers['X-XSRF-TOKEN'] = xsrfToken;
  }
  return config;
});

// Add a response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data on 401 errors
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      Cookies.remove('token');
      
      // Redirect to login if we're in a browser environment
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export const auth = {
  register: async (data: { email: string; password: string; name: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data.data;
  },

  verifyEmail: async (token: string) => {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data.data;
  },

  resetPassword: async (data: { token: string; newPassword: string }) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data.data;
  },

  requestPasswordReset: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await api.post('/auth/change-password', data);
    return response.data.data;
  },
};

export const user = {
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  updateProfile: async (data: { name?: string; email?: string }) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },
};

export const apiKeys = {
  create: async (data: { vendor: VendorId; apiKey: string; name?: string }): Promise<ApiKey> => {
    const response = await api.post('/keys', {
      name: data.name || `${data.vendor} Key`,
      key: data.apiKey,
      vendor: data.vendor
    });
    return response.data;
  },

  list: async (): Promise<ApiKey[]> => {
    const response = await api.get('/keys');
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/keys/${id}`);
  },

  update: async (id: string, data: { name?: string }): Promise<ApiKey> => {
    const response = await api.patch(`/keys/${id}`, data);
    return response.data;
  },

  validate: async (apiKey: string): Promise<{ isValid: boolean; error?: string }> => {
    try {
      // First validate the format
      if (!apiKey.startsWith('sk-')) {
        return { 
          isValid: false, 
          error: 'Invalid API key format. OpenAI API keys must start with "sk-"' 
        };
      }

      // Make a test request to the OpenAI API
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { isValid: true };
      } else {
        // Handle specific OpenAI API errors
        const errorMessage = data.error?.message;
        if (errorMessage?.includes('exceeded your current quota')) {
          return { 
            isValid: true, // Key is valid but has no credits
            error: 'Your API key is valid but has no available credits. Please check your billing status.' 
          };
        }
        return { 
          isValid: false, 
          error: errorMessage || 'Invalid API key' 
        };
      }
    } catch (error: any) {
      return { 
        isValid: false, 
        error: error.message || 'Failed to validate API key' 
      };
    }
  }
};

export default api; 