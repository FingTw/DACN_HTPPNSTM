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
  logout: () => api.get("/auth/logout"),
  getProfile: () => api.get("/auth/update-personal-info"),
};

// Type chung
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  count?: number;
}

export default api;
