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

export interface Role {
  MaVT: string;
  TenVT: string;
}

export interface Position {
  MaCV: string;
  TenCV: string;
  MoTa?: string;
}

export interface Department {
  MaPB: string;
  TenPB: string;
  MoTa?: string;
}

export interface Category {
  MaDM: string;
  TenDM: string;
  MoTa?: string;
}

export interface Warehouse {
  MaKho: string;
  TenKho: string;
  DC?: string;
  SucChua?: string;
}

export interface Employee {
  MaNV: string;
  HoTen: string;
  Email?: string;
  SDT?: string;
  MaPB?: string;
  MaCV?: string;
  MaPB_phongban?: { TenPB: string };
  MaCV_chucvu?: { TenCV: string };
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

  getMetaData: async () => {
    const response = await api.get("/admin/metadata");
    return response.data.data; // { roles: [], positions: [] }
  },

  createUser: async (data: any) => {
    return api.post("/admin/users", data);
  },

  updateUserFull: async (MaTK: string, data: any) => {
    return api.put(`/admin/users/${MaTK}/full`, data);
  },

  deleteUser: async (MaTK: string) => {
    return api.delete(`/admin/users/${MaTK}`);
  },

  // Lấy chi tiết user để edit (bao gồm Roles hiện tại)
  getUserDetail: async (MaTK: string) => {
    const response = await api.get(`/admin/users/${MaTK}`);
    return response.data.data;
  },

  // ==========================================
  // PHÒNG BAN
  // ==========================================
  getDepartments: async (
    page = 1,
    limit = 10,
    search = ""
  ): Promise<{
    departments: Department[];
    total: number;
    totalPages: number;
  }> => {
    const response = await api.get("/admin/departments", {
      params: { page, limit, search },
    });
    return response.data.data;
  },

  createDepartment: async (data: any) => {
    return api.post("/admin/departments", data);
  },

  updateDepartment: async (MaPB: string, data: any) => {
    return api.put(`/admin/departments/${MaPB}`, data);
  },

  deleteDepartment: async (MaPB: string) => {
    return api.delete(`/admin/departments/${MaPB}`);
  },

  // ==========================================
  // CHỨC VỤ
  // ==========================================
  getPositions: async (
    page = 1,
    limit = 10,
    search = ""
  ): Promise<{ positions: Position[]; total: number; totalPages: number }> => {
    const response = await api.get("/admin/positions", {
      params: { page, limit, search },
    });
    return response.data.data;
  },

  createPosition: async (data: any) => {
    return api.post("/admin/positions", data);
  },

  updatePosition: async (MaCV: string, data: any) => {
    return api.put(`/admin/positions/${MaCV}`, data);
  },

  deletePosition: async (MaCV: string) => {
    return api.delete(`/admin/positions/${MaCV}`);
  },

  // ==========================================
  // DANH MỤC
  // ==========================================
  getCategories: async (
    page = 1,
    limit = 10,
    search = ""
  ): Promise<{ categories: Category[]; total: number; totalPages: number }> => {
    const response = await api.get("/admin/categories", {
      params: { page, limit, search },
    });
    return response.data.data;
  },

  createCategory: async (data: any) => {
    return api.post("/admin/categories", data);
  },

  updateCategory: async (MaDM: string, data: any) => {
    return api.put(`/admin/categories/${MaDM}`, data);
  },

  deleteCategory: async (MaDM: string) => {
    return api.delete(`/admin/categories/${MaDM}`);
  },

  // ==========================================
  // KHO BÃI
  // ==========================================
  getWarehouses: async (
    page = 1,
    limit = 10,
    search = ""
  ): Promise<{
    warehouses: Warehouse[];
    total: number;
    totalPages: number;
  }> => {
    const response = await api.get("/admin/warehouses", {
      params: { page, limit, search },
    });
    return response.data.data;
  },

  createWarehouse: async (data: any) => {
    return api.post("/admin/warehouses", data);
  },

  updateWarehouse: async (MaKho: string, data: any) => {
    return api.put(`/admin/warehouses/${MaKho}`, data);
  },

  deleteWarehouse: async (MaKho: string) => {
    return api.delete(`/admin/warehouses/${MaKho}`);
  },

  // ==========================================
  // NHÂN VIÊN
  // ==========================================
  getEmployees: async (
    page = 1,
    limit = 10,
    search = ""
  ): Promise<{ employees: Employee[]; total: number; totalPages: number }> => {
    const response = await api.get("/admin/employees", {
      params: { page, limit, search },
    });
    return response.data.data;
  },

  getEmployeeDetail: async (MaNV: string) => {
    const response = await api.get(`/admin/employees/${MaNV}`);
    return response.data.data;
  },

  updateEmployee: async (MaNV: string, data: any) => {
    return api.put(`/admin/employees/${MaNV}`, data);
  },
};
