import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In production, Next.js proxy mapped this natively. Here, we point explicitly to Vercel API.
const api = axios.create({
  baseURL: 'https://backend-two-rust-69.vercel.app/api',
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: inject JWT automatically natively via AsyncStorage bridging.
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('kb_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// We won't inherently auto-navigate strictly in the interceptor since React Navigation 
// contexts are scoped independently, but we can emit a signal or clear local state.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('kb_token');
      await AsyncStorage.removeItem('kb_user');
      // In production, the AuthContext listening on token removal should drop navigation to AuthStack.
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (data: { name: string; phone: string; password: string; pin?: string }) =>
    api.post('/auth/signup', data),
  login: (data: { phone: string; password: string }) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  setPin: (pin: string) => api.put('/auth/pin', { pin }),
  verifyPin: (pin: string) => api.post('/auth/verify-pin', { pin }),
  updateAutoLock: (time: number | null) => api.put('/auth/auto-lock', { time }),
  uploadProfileImage: (formData: FormData) => api.post('/auth/upload-profile-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' } // React Native forms work identical here
  }),
  requestEmailUpdate: (newEmail: string) => api.post('/auth/request-email-update', { newEmail }),
  updateEmail: (otp: string) => api.post('/auth/update-email', { otp }),
  sendOtp: (email: string, purpose?: string) => api.post('/auth/send-otp', { email, purpose }),
  forgotPasswordOtp: (email: string) => api.post('/auth/forgot-password', { email }),
  changePassword: (data: { email: string; otp: string; newPassword: string }) => api.post('/auth/change-password', data),
  changePin: (data: { email: string; otp: string; newPin: string }) => api.post('/auth/change-pin', data),
};

export default api;
