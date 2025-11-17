import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";

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

export interface UserProfile {
  MaTK: string;
  TenDangNhap: string;
  HoTen?: string;
  SDT?: string;
  Email?: string;
  MaHA_Avatar?: string;
  Avatar?: {
    MaHA: string;
    URL: string;
    MoTa?: string;
  };
}

export interface UpdateProfileData {
  HoTen?: string;
  SDT?: string;
  Email?: string;
  TenDangNhap?: string;
  AvtURL?: string;
  AvtMoTa?: string;
  AvtMaHA?: string;
}

export interface UploadAvatarResponse {
  message: string;
  data: {
    avatarURL: string;
    avatarId: string;
  };
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
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
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/signin";
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  register: (userData: SignupData) => api.post("/auth/register", userData),
  
  login: async (credentials: LoginData) => {
    const response = await api.post<AuthResponse>("/auth/login", credentials);
    const { token, user } = response.data;

    if (token && user) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      const event = new Event("authChange");
      window.dispatchEvent(event);
    }

    return response;
  },
  
  logout: () => api.get("/auth/logout"),

  // API lấy thông tin profile từ server
  getProfile: () => api.get("/auth/profile"),
  
  updatePersonalInfo: (data: UpdateProfileData) => 
    api.put("/auth/update-personal-info", data),
  
  // API upload avatar
  uploadAvatar: (formData: FormData) => 
    api.post("/auth/upload-avatar", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
};

export default api;