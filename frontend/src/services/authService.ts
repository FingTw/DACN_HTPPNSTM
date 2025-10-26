import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  register: (userData: SignupData) => api.post('/auth/register', userData),
  login: (credentials: LoginData) => api.post('/auth/login', credentials),
  logout: () => api.get('/auth/logout'),
  getProfile: () => api.get('/auth/update-personal-info'),
};

// Types
export interface SignupData {
  TenDangNhap: string;
  Email: string;
  MatKhau: string;
  confirmPassword?: string;
}

export interface LoginData {
  TenDangNhap: string;
  MatKhau: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user?: {
    MaTK: string;
    TenDangNhap: string;
    role: string;
  };
}

export default api;