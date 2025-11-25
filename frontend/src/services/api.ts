// src/services/api.ts
import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/signin";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData: any) => api.post("/auth/register", userData),
  login: async (credentials: any) => {
    const response = await api.post<any>("/auth/login", credentials);
    const { token, user } = response.data;
    if (token && user) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("authChange"));
    }
    return response;
  },
  googleLogin: async (token: string) => {
    const response = await api.post<any>("/auth/google", { token });
    const { token: jwtToken, user } = response.data;
    if (jwtToken && user) {
      localStorage.setItem("token", jwtToken);
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("authChange"));
    }
    return response;
  },
  
  facebookLogin: async (accessToken: string) => {
    const response = await api.post<any>("/auth/facebook", { accessToken });
    const { token: jwtToken, user } = response.data;
    if (jwtToken && user) {
      localStorage.setItem("token", jwtToken);
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("authChange"));
    }
    return response;
  },
  logout: () => api.get("/auth/logout"),
  getProfile: () => api.get("/auth/update-personal-info"),
  uploadAvatar: (formData: FormData) => 
    api.post("/auth/upload-avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  changePassword: (data: any) => api.put("/auth/change-password", data),
  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
  resetPassword: (data: any) => api.post("/auth/reset-password", data),
};

// Type chung
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  count?: number;
}
// User interface
export interface User {
  MaTK: string;
  TenDangNhap: string;
  HoTen: string;
  Email: string;
  role: string;
  roles: string[];
  MaCH: string | null;
  Avatar?: {
    MaHA: string;
    URL: string;
    MoTa: string;
  } | null;
}
export default api;
