// src/services/adminService.ts
import api from "./api";

export interface SystemStats {
  totalUsers: number;
  totalShops: number;
  totalOrders: number;
  totalProducts: number;
  revenue: number;
}

export interface User {
  MaTK: string;
  TenDangNhap: string;
  Email: string;
  HoTen: string;
  SDT: string;
  TrangThai: string;
  NgayTao: string;
  Role?: string;
}

export interface Shop {
  MaCH: string;
  TenCH: string;
  ChuSoHuu: string; // Tên chủ shop
  NgayTao: string;
  TrangThai: string; // Active/Pending
  SLSanPham: number;
}

export const adminService = {
  // 1. Lấy thống kê tổng quan
  getStats: async (): Promise<SystemStats> => {
    try {
      // Backend cần có endpoint này: GET /api/admin/stats
      const response = await api.get("/admin/stats");
      return response.data.data;
    } catch (error) {
      console.error("Lỗi lấy thống kê:", error);
      // Fallback tạm thời nếu API chưa sẵn sàng
      return {
        totalUsers: 0,
        totalShops: 0,
        totalOrders: 0,
        totalProducts: 0,
        revenue: 0,
      };
    }
  },

  // 2. Lấy danh sách người dùng
  getUsers: async (
    page = 1,
    limit = 10,
    search = ""
  ): Promise<{ users: User[]; total: number }> => {
    const response = await api.get("/admin/users", {
      params: { page, limit, search },
    });
    return response.data.data;
  },

  // 3. Lấy danh sách cửa hàng
  getShops: async (
    page = 1,
    limit = 10
  ): Promise<{ shops: Shop[]; total: number }> => {
    const response = await api.get("/admin/shops", { params: { page, limit } });
    return response.data.data;
  },

  // 4. Duyệt/Khóa cửa hàng
  updateShopStatus: async (
    MaCH: string,
    status: "Active" | "Locked"
  ): Promise<boolean> => {
    await api.put(`/admin/shops/${MaCH}/status`, { status });
    return true;
  },
};
