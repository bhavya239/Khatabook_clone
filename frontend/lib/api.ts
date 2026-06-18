import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://backend-two-rust-69.vercel.app/api',
  headers: { 'Content-Type': 'application/json' },
});

// Automatically attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('kb_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response interceptor: auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('kb_token');
      localStorage.removeItem('kb_user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// ──────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────
export const authAPI = {
  signup: (data: { name: string; phone: string; password: string; pin?: string }) =>
    api.post('/auth/signup', data),
  login: (data: { phone: string; password: string }) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  setPin: (pin: string) => api.put('/auth/pin', { pin }),
  verifyPin: (pin: string) => api.post('/auth/verify-pin', { pin }),
  updateAutoLock: (time: number | null) => api.put('/auth/auto-lock', { time }),
  uploadProfileImage: (formData: FormData) => api.post('/auth/upload-profile-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  requestEmailUpdate: (newEmail: string) => api.post('/auth/request-email-update', { newEmail }),
  updateEmail: (otp: string) => api.post('/auth/update-email', { otp }),
  sendOtp: (email: string, purpose?: string) => api.post('/auth/send-otp', { email, purpose }),
  forgotPasswordOtp: (email: string) => api.post('/auth/forgot-password', { email }),
  changePassword: (data: { email: string; otp: string; newPassword: string }) => api.post('/auth/change-password', data),
  changePin: (data: { email: string; otp: string; newPin: string }) => api.post('/auth/change-pin', data),
};

// ──────────────────────────────────────────────
// Contacts
// ──────────────────────────────────────────────
export const contactAPI = {
  getAll: () => api.get('/contacts'),
  getScores: () => api.get('/contacts/score'),
  getOne: (id: string) => api.get(`/contacts/${id}`),
  create: (data: { name: string; phone: string; notes?: string }) =>
    api.post('/contacts', data),
  update: (id: string, data: { name: string; phone: string; notes?: string }) =>
    api.put(`/contacts/${id}`, data),
  delete: (id: string) => api.delete(`/contacts/${id}`),
};

// ──────────────────────────────────────────────
// Transactions
// ──────────────────────────────────────────────
export const transactionAPI = {
  getAll: (params?: {
    contact?: string;
    type?: 'given' | 'received';
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
    page?: number;
    limit?: number;
  }) => api.get('/transactions', { params }),
  getOne: (id: string) => api.get(`/transactions/${id}`),
  create: (data: {
    contact: string;
    type: 'given' | 'received';
    amount: number;
    description?: string;
    date?: string;
    category?: string;
    dueDate?: string;
  }) => api.post('/transactions', data),
  update: (id: string, data: { description?: string; category?: string }) =>
    api.put(`/transactions/${id}`, data),
  delete: (id: string) => api.delete(`/transactions/${id}`),
  getSummary: (params?: { month?: number; year?: number }) =>
    api.get('/transactions/summary', { params }),
  getOverdue: () => api.get('/transactions/overdue'),
  sendReminder: (contactId: string) =>
    api.post(`/transactions/remind/${contactId}`),
};

// ──────────────────────────────────────────────
// Admin
// ──────────────────────────────────────────────
export const reportAPI = {
  getProfitLoss: (mode?: 'personal' | 'business') => 
    api.get(mode ? `/reports/profit-loss?mode=${mode}` : '/reports/profit-loss'),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
};

// ──────────────────────────────────────────────
// Todos
// ──────────────────────────────────────────────
export const todoAPI = {
  getAll: (date?: 'yesterday' | 'today' | 'tomorrow') => 
    api.get(date ? `/todos?date=${date}` : '/todos'),
  create: (data: { title: string; amount?: number; type?: 'collect' | 'give' | 'other'; contact?: string; dueDate?: string }) => 
    api.post('/todos', data),
  updateStatus: (id: string, status: 'pending' | 'completed') => 
    api.put(`/todos/${id}`, { status }),
  delete: (id: string) => api.delete(`/todos/${id}`),
};

export default api;
