// src/services/danhGiaSanPhamService.ts
import { api } from "./api";
import type { ApiResponse } from "./api";

// ============================================
// TYPES - CẬP NHẬT THEO BACKEND
// ============================================

export interface DanhGiaUser {
  MaTK: string;
  TenDangNhap: string;
  Email?: string;
}

export interface DanhGiaSanPham {
  MaDG: string;
  MaSP: string;
  MaTK: string; // ✅ SỬA: string thay vì number
  Diem: number;
  NoiDung: string | null;
  DaMua: boolean;
  NgayDG: string;
  HieuLuc: boolean;
  taikhoan?: DanhGiaUser; // ✅ THÊM: user info
}

export interface DanhGiaThongKe {
  tongDanhGia: number;
  daMuaHang: number;
  thongKeChiTiet: Array<{
    diem: number;
    soLuong: number;
    phanTram: number;
  }>;
}

export interface DanhGiaListResponse {
  thongTinSanPham: {
    MaSP: string;
    TenSP: string;
    DiemDG_SP: number;
    SoLuongDanhGia_SP: number;
  };
  thongKe: DanhGiaThongKe;
  danhGia: {
    items: DanhGiaSanPham[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  };
}

// ============================================
// DANHGIA SANPHAM SERVICE - SỬA THEO BACKEND
// ============================================

export const danhGiaSanPhamService = {
  // 🟢 1. Tạo đánh giá - SỬA ENDPOINT
  create: async (
    MaSP: string,
    data: {
      Diem: number;
      NoiDung?: string;
      DaMua?: boolean;
    }
  ): Promise<{ danhGia: DanhGiaSanPham; thongKe: any } | null> => {
    try {
      const response = await api.post<ApiResponse<any>>(
        `/sanpham/${MaSP}/danhgia`, // ✅ ENDPOINT ĐÚNG
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error("❌ Lỗi tạo đánh giá SP:", error.response?.data || error);
      throw new Error(error.response?.data?.message || "Lỗi tạo đánh giá");
    }
  },

  // 🟢 2. Lấy danh sách đánh giá - SỬA ENDPOINT & PARAMS
  getForSanPham: async (
    MaSP: string,
    params?: {
      page?: number;
      limit?: number;
      sort?: "newest" | "oldest" | "highest" | "lowest";
      filter?: "all" | "purchased" | "with_content" | string;
    }
  ): Promise<DanhGiaListResponse | null> => {
    try {
      const response = await api.get<ApiResponse<DanhGiaListResponse>>(
        `/sanpham/${MaSP}/danhgia`, // ✅ ENDPOINT ĐÚNG
        { params }
      );
      return response.data.data;
    } catch (error: any) {
      console.error("❌ Lỗi lấy đánh giá SP:", error.response?.data || error);
      return null;
    }
  },

  // 🟢 3. Cập nhật đánh giá - SỬA ENDPOINT
  update: async (
    MaDG: string,
    data: {
      Diem?: number;
      NoiDung?: string | null;
      DaMua?: boolean;
    }
  ): Promise<{ danhGia: DanhGiaSanPham; thongKe: any } | null> => {
    try {
      const response = await api.put<ApiResponse<any>>(
        `/danhgia/sanpham/${MaDG}`, // ✅ ENDPOINT ĐÚNG
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error("❌ Lỗi cập nhật đánh giá:", error.response?.data || error);
      throw new Error(error.response?.data?.message || "Lỗi cập nhật đánh giá");
    }
  },

  // 🟢 4. Xóa đánh giá - SỬA ENDPOINT
  delete: async (MaDG: string): Promise<{ thongKe: any } | null> => {
    try {
      const response = await api.delete<ApiResponse<any>>(
        `/danhgia/sanpham/${MaDG}` // ✅ ENDPOINT ĐÚNG
      );
      return response.data.data;
    } catch (error: any) {
      console.error("❌ Lỗi xóa đánh giá:", error.response?.data || error);
      throw new Error(error.response?.data?.message || "Lỗi xóa đánh giá");
    }
  },

  // 🟢 5. Lấy đánh giá của tôi cho SP - SỬA ENDPOINT
  getMyForSanPham: async (MaSP: string): Promise<DanhGiaSanPham | null> => {
    try {
      const response = await api.get<ApiResponse<DanhGiaSanPham>>(
        `/danhgia/my/sanpham/${MaSP}` // ✅ ENDPOINT ĐÚNG
      );
      return response.data.data;
    } catch (error: any) {
      console.error(
        "❌ Lỗi lấy đánh giá của tôi:",
        error.response?.data || error
      );
      return null;
    }
  },

  // 🟢 6. Thống kê đánh giá SP - SỬA ENDPOINT
  getThongKe: async (
    MaSP: string
  ): Promise<{
    thongTinSanPham: any;
    thongKe: DanhGiaThongKe;
  } | null> => {
    try {
      const response = await api.get<ApiResponse<any>>(
        `/danhgia/thongke/sanpham/${MaSP}` // ✅ ENDPOINT ĐÚNG
      );
      return response.data.data;
    } catch (error: any) {
      console.error("❌ Lỗi thống kê đánh giá:", error.response?.data || error);
      return null;
    }
  },
};
