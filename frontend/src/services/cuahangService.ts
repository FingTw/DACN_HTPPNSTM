// src/services/cuahangService.ts
import { api } from "./api";
import type { ApiResponse } from "./api";

// ============================================
// TYPES
// ============================================

export interface Cuahang {
  MaCH: string;
  TenCH: string;
  SLTheoDoi: number;
  DiemDG: number;
  SoDu?: number | string;
  MaHA_CuaHang?: string | null;
  MaTK: number;
  MaHD?: string;

  // Include relations
  MaHA_CuaHang_hinhanh?: {
    MaHA: string;
    URL: string | undefined;
    MoTa?: string | null;
  } | null;
  hdbanhang?: {
    MaHD: string;
    NgayLap: string;
    LoaiHinhKD: string;
    MaSoThue?: string | null;
    DCLayHang?: string | null;
  } | null;
  taikhoan?: {
    MaTK: number;
    TenDangNhap: string;
    Email: string;
    LoaiTK?: string;
  };
}

export interface ThongKeTonKho {
  thongTinCuaHang: { MaCH: string; TenCH: string };
  tongQuan: {
    tongSoSanPham: number;
    tongSoLuongTon: number;
    tongGiaTriTonKho: number;
    trungBinhTonKho: number;
  };
  phanLoaiTonKho: {
    sapHetHang: { soLuong: number };
    hetHang: { soLuong: number };
    conNhieu: { soLuong: number };
  };
  chiTietSanPham: Array<{
    MaSP: string;
    TenSP: string;
    SLTon: number;
    GiaBan: number | string;
    TrangThai: string;
    DVT: string;
  }>;
}

export interface CuahangPagination {
  cuahangs: Cuahang[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// CỬA HÀNG SERVICE
// ============================================

export const cuahangService = {
  // 1. Đăng ký cửa hàng
  create: async (data: {
    TenCH: string;
    MaHA_CuaHang?: string;
    LoaiHinhKD?: string;
    MaSoThue?: string;
    DCLayHang?: string;
  }): Promise<
    ApiResponse<{ store: Cuahang; contract: any }>["data"] | null
  > => {
    try {
      const response = await api.post<
        ApiResponse<{ store: Cuahang; contract: any }>
      >("/cuahang/dang-ky", data);
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi đăng ký cửa hàng:", error);
      return null;
    }
  },

  // 2. Lấy tất cả cửa hàng + phân trang + include
  getAll: async (
    params: {
      page?: number;
      limit?: number;
      include?: string;
    } = {}
  ): Promise<CuahangPagination> => {
    try {
      const response = await api.get<ApiResponse<CuahangPagination>>(
        "/cuahang",
        { params }
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi lấy danh sách cửa hàng:", error);
      return {
        cuahangs: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
    }
  },

  // 3. Lấy theo ID
  getById: async (MaCH: string, include?: string): Promise<Cuahang | null> => {
    try {
      const response = await api.get<ApiResponse<Cuahang>>(`/cuahang/${MaCH}`, {
        params: { include },
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi lấy chi tiết cửa hàng:", error);
      return null;
    }
  },

  // 4. Lấy cửa hàng của tôi
  getMyStore: async (): Promise<Cuahang | null> => {
    try {
      const response = await api.get<ApiResponse<Cuahang>>(
        "/cuahang/cua-toi/thong-tin"
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi lấy cửa hàng của tôi:", error);
      return null;
    }
  },

  // 5. Cập nhật
  update: async (
    MaCH: string,
    data: Partial<Pick<Cuahang, "TenCH" | "MaHA_CuaHang">>
  ): Promise<Cuahang | null> => {
    try {
      const response = await api.put<ApiResponse<Cuahang>>(
        `/cuahang/${MaCH}`,
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi cập nhật cửa hàng:", error);
      return null;
    }
  },

  // 6. Xóa
  delete: async (MaCH: string): Promise<boolean> => {
    try {
      await api.delete(`/cuahang/${MaCH}`);
      return true;
    } catch (error: any) {
      console.error("Lỗi xóa cửa hàng:", error);
      return false;
    }
  },

  // 7. Tìm kiếm
  search: async (keyword: string): Promise<Cuahang[]> => {
    try {
      const response = await api.get<ApiResponse<Cuahang[]>>(
        "/cuahang/tim-kiem",
        { params: { keyword } }
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi tìm kiếm cửa hàng:", error);
      return [];
    }
  },

  // 8. Theo dõi / bỏ theo dõi
  follow: async (
    MaCH: string,
    action: "tang" | "giam"
  ): Promise<Cuahang | null> => {
    try {
      const response = await api.post<ApiResponse<Cuahang>>(
        `/cuahang/${MaCH}/theo-doi`,
        { action }
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi theo dõi cửa hàng:", error);
      return null;
    }
  },

  // 9. Thống kê tồn kho (public hoặc của mình)
  getInventoryStats: async (MaCH?: string): Promise<ThongKeTonKho | null> => {
    try {
      const url = MaCH
        ? `/cuahang/${MaCH}/thong-ke-ton-kho`
        : `/cuahang/tao/thong-ke-ton-kho`;
      const response = await api.get<ApiResponse<ThongKeTonKho>>(url);
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi thống kê tồn kho:", error);
      return null;
    }
  },

  // 10. Thống kê có filter (chỉ chủ shop)
  getInventoryStatsFiltered: async (filters: {
    minStock?: number;
    maxStock?: number;
    trangThai?: string;
  }): Promise<any> => {
    try {
      const response = await api.get("/cuahang/tao/thong-ke-ton-kho", {
        params: filters,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi thống kê có lọc:", error);
      return null;
    }
  },
};
