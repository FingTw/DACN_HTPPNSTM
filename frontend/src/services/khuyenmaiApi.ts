import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor để tự động thêm token
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

export interface KhuyenMai {
  MaKM: string;
  TenKM: string;
  MoTa: string;
  LoaiKM: string;
  GiaTriGiam: number;
  HinhThucGiam: string;
  DieuKien: number;
  SoTienGiamToiDa: number;
  NgayBatDau: string;
  NgayKetThuc: string;
  GioiHanSuDung: number;
  MaCH: string | null;
  NgayTao?: string;
  TrangThai?: string;
  // ✅ THÊM fields từ associations
  MaCH_cuahang?: {
    TenCH: string;
  };
}

export interface CreateKhuyenMaiData {
  TenKM: string;
  MoTa: string;
  LoaiKM: string;
  GiaTriGiam: number;
  HinhThucGiam: string;
  DieuKien: number;
  SoTienGiamToiDa: number;
  NgayBatDau: string;
  NgayKetThuc: string;
  GioiHanSuDung: number;
}

export interface KhuyenMaiDaNhan {
  MaKM: string;
  MaTK: string;
  SoLanSuDung: number;
  NgayNhan?: string;
  MaKM_khuyenmai?: KhuyenMai;
}

export interface KhuyenMaiResponse {
  allKhuyenMai: KhuyenMai[];
  receivedKhuyenMai: KhuyenMaiDaNhan[];
  receivedMaKMs: string[];
}

export interface UserInfo {
  MaTK: string;
  role: string;
  MaCH?: string;
  username: string;
  HoTen?: string;
}

export interface DebugInfo {
  totalCount: number;
  sampleData: KhuyenMai[];
  message: string;
}

// 🔥 CHUYỂN SANG DÙNG API THẬT
const USE_MOCK_DATA = false; // Set thành false để dùng API thật

export const khuyenMaiAPI = {
  // ==================== AUTH & DEBUG ====================
  // Lấy thông tin user từ token (API thật)
  getUserInfo: async (): Promise<{ data: UserInfo }> => {
    try {
      const response = await api.get('/auth/me');
      return response;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin user:", error);
      throw error;
    }
  },

  // Debug API để kiểm tra kết nối
  debugKhuyenMai: (): Promise<{ data: DebugInfo }> => {
    return api.get('/khuyen-mai/debug');
  },

  // ==================== QUẢN LÝ KHuyẾN MÃI ====================
  // Tạo khuyến mãi mới
  createKhuyenMai: (data: CreateKhuyenMaiData): Promise<{ data: any }> => {
    return api.post('/khuyen-mai/create', data); // ✅ CẬP NHẬT route
  },

  // Lấy tất cả khuyến mãi (PHÂN QUYỀN TỰ ĐỘNG)
  getAllKhuyenMai: (): Promise<{ data: KhuyenMai[] }> => {
    return api.get('/khuyen-mai/manage/all'); // ✅ CẬP NHẬT route
  },

  // Lấy khuyến mãi của cửa hàng (route riêng nếu cần)
  getKhuyenMaiByCuaHang: (): Promise<{ data: KhuyenMai[] }> => {
    return api.get('/khuyen-mai/cua-hang/my'); // ✅ GIỮ NGUYÊN
  },

  // Cập nhật khuyến mãi
  updateKhuyenMai: (MaKM: string, data: Partial<CreateKhuyenMaiData>): Promise<{ data: any }> => {
    return api.put(`/khuyen-mai/${MaKM}`, data); // ✅ GIỮ NGUYÊN
  },

  // Xóa khuyến mãi
  deleteKhuyenMai: (MaKM: string): Promise<{ data: any }> => {
    return api.delete(`/khuyen-mai/${MaKM}`); // ✅ GIỮ NGUYÊN
  },

  // ==================== CHO KHÁCH HÀNG ====================
  // Lấy danh sách khuyến mãi cho khách hàng
  getKhuyenMaiForCustomer: (): Promise<{ data: KhuyenMaiResponse }> => {
    return api.get('/khuyen-mai/khach-hang/khuyen-mai'); // ✅ GIỮ NGUYÊN
  },
  
  // Nhận khuyến mãi
  nhanKhuyenMai: (MaKM: string): Promise<{ data: any }> => {
    return api.post('/khuyen-mai/nhan-khuyen-mai', { MaKM }); // ✅ GIỮ NGUYÊN
  },
  
  // Lấy khuyến mãi đã nhận
  getKhuyenMaiDaNhan: (): Promise<{ data: KhuyenMaiDaNhan[] }> => {
    return api.get('/khuyen-mai/user-khuyen-mai'); // ✅ GIỮ NGUYÊN
  },

  // ==================== ADMIN TOOLS ====================
  // Admin gán khuyến mãi cho user
  assignKhuyenMaiToUser: (MaKM: string, MaTK: string): Promise<{ data: any }> => {
    return api.post('/khuyen-mai/assign', { MaKM, MaTK }); // ✅ GIỮ NGUYÊN
  },
};

export default api;