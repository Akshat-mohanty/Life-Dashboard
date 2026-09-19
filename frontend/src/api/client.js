/**
 * Axios API Client with Cognito Token Injection & Domain Methods
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor: inject Cognito JWT token and user context
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('life_dashboard_jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const cachedUserStr = localStorage.getItem('life_dashboard_user');
    if (cachedUserStr) {
      try {
        const user = JSON.parse(cachedUserStr);
        if (user.userId) {
          config.headers['x-user-id'] = user.userId;
        }
      } catch (e) {
        // ignore parse errors
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle session expiration and errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Session expired or unauthorized. Please re-authenticate.');
    }
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

/* ==========================================================================
 * MODULE API HELPERS
 * ========================================================================== */

// 1. Bills API
export const billsApi = {
  list: () => apiClient.get('/bills'),
  create: (data) => apiClient.post('/bills', data),
  update: (id, data) => apiClient.put(`/bills/${id}`, data),
  delete: (id) => apiClient.delete(`/bills/${id}`),
};

// 2. Tasks API
export const tasksApi = {
  list: () => apiClient.get('/tasks'),
  create: (data) => apiClient.post('/tasks', data),
  update: (id, data) => apiClient.put(`/tasks/${id}`, data),
  delete: (id) => apiClient.delete(`/tasks/${id}`),
};

// 3. Calendar API
export const calendarApi = {
  list: (params) => apiClient.get('/calendar', { params }),
  create: (data) => apiClient.post('/calendar', data),
  delete: (id) => apiClient.delete(`/calendar/${id}`),
};

// 4. Health Reminders API
export const healthApi = {
  list: () => apiClient.get('/health'),
  create: (data) => apiClient.post('/health', data),
  delete: (id) => apiClient.delete(`/health/${id}`),
};

// 5. Documents API (with presigned S3 upload)
export const documentsApi = {
  list: () => apiClient.get('/documents'),
  upload: async (file, metadata = {}) => {
    // Step 1: Request presigned URL and register metadata in DynamoDB
    const initResponse = await apiClient.post('/documents/upload', {
      name: metadata.name || file.name,
      fileName: file.name,
      fileType: file.type || 'application/pdf',
      category: metadata.category || 'other',
      expiryDate: metadata.expiryDate || null,
    });

    const { uploadUrl, item } = initResponse;

    // Step 2: Directly upload binary payload to S3 via presigned PUT URL
    if (uploadUrl) {
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type || 'application/pdf',
        },
      });
    }

    return item;
  },
  delete: (id) => apiClient.delete(`/documents/${id}`),
};

// 6. Spending API
export const spendingApi = {
  list: (params) => apiClient.get('/spending', { params }),
  summary: (month, budget) =>
    apiClient.get('/spending/summary', {
      params: {
        ...(month ? { month } : {}),
        ...(budget ? { budget } : {}),
      },
    }),
  create: (data) => apiClient.post('/spending', data),
};

// 7. Morning Briefing API
export const briefingApi = {
  getToday: (params) => apiClient.get('/briefing/today', { params }),
  generateNow: (data) => apiClient.post('/briefing/generate', data),
};

// 8. User Profile API (Single-Table DB Isolation)
export const userApi = {
  getProfile: () => apiClient.get('/user/profile'),
  updateProfile: (data) => apiClient.put('/user/profile', data),
};

// 9. Historical Life Archive API (Strictly Scoped to Current User)
export const archiveApi = {
  getDaily: (date) => apiClient.get('/archive/daily', { params: { date } }),
};

export default apiClient;
