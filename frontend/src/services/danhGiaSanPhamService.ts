// src/services/danhGiaSanPhamService.ts
import { api } from "./api";
import type { ApiResponse } from "./api";

// ============================================
// TYPES
// ============================================

export interface DanhGiaSanPham {
  MaDG: string;
  Diem: number;
  NoiDung: string;
  NgayDG: string;
  HieuLuc: boolean;
  MaSP: string;
  MaTK: number;
}

// ============================================
// DANHGIA SANPHAM SERVICE
// ============================================

export const danhGiaSanPhamService = {
  // 1. Tạo đánh giá
  create: async (
    data: Omit<DanhGiaSanPham, "MaDG" | "NgayDG" | "HieuLuc">
  ): Promise<DanhGiaSanPham | null> => {
    try {
      const response = await api.post<ApiResponse<DanhGiaSanPham>>(
        "/danhgia/sanpham",
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi tạo đánh giá SP:", error);
      return null;
    }
  },

  // 2. Lấy đánh giá cho SP
  getForSanPham: async (
    MaSP: string,
    params?: { page?: number; limit?: number }
  ): Promise<any> => {
    try {
      const response = await api.get<ApiResponse<any>>(
        `/danhgia/sanpham/${MaSP}`,
        { params }
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi lấy đánh giá SP:", error);
      return null;
    }
  },

  // 3. Cập nhật đánh giá
  update: async (
    MaDG: string,
    data: Partial<DanhGiaSanPham>
  ): Promise<DanhGiaSanPham | null> => {
    try {
      const response = await api.put<ApiResponse<DanhGiaSanPham>>(
        `/danhgia/sanpham/${MaDG}`,
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi cập nhật đánh giá SP:", error);
      return null;
    }
  },

  // 4. Xóa đánh giá
  delete: async (MaDG: string): Promise<boolean> => {
    try {
      await api.delete(`/danhgia/sanpham/${MaDG}`);
      return true;
    } catch (error: any) {
      console.error("Lỗi xóa đánh giá SP:", error);
      return false;
    }
  },

  // 5. Lấy đánh giá của tôi cho SP
  getMyForSanPham: async (MaSP: string): Promise<DanhGiaSanPham | null> => {
    try {
      const response = await api.get<ApiResponse<DanhGiaSanPham>>(
        `/danhgia/my/sanpham/${MaSP}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi lấy đánh giá của tôi:", error);
      return null;
    }
  },

  // 6. Thống kê đánh giá SP
  getThongKe: async (MaSP: string): Promise<any | null> => {
    try {
      const response = await api.get<ApiResponse<any>>(
        `/danhgia/thongke/sanpham/${MaSP}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi thống kê đánh giá SP:", error);
      return null;
    }
  },
};
