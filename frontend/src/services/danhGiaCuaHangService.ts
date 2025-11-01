// src/services/danhGiaCuaHangService.ts
import { api } from "./api";
import type { ApiResponse } from "./api";

// ============================================
// TYPES
// ============================================

export interface DanhGiaCuaHang {
  MaDG: string;
  Diem: number;
  NoiDung: string;
  NgayDG: string;
  MaCH: string;
  MaTK: number;
}

// ============================================
// DANHGIA CUAHANG SERVICE
// ============================================

export const danhGiaCuaHangService = {
  // 1. Tạo đánh giá cửa hàng
  create: async (
    data: Omit<DanhGiaCuaHang, "MaDG" | "NgayDG">
  ): Promise<DanhGiaCuaHang | null> => {
    try {
      const response = await api.post<ApiResponse<DanhGiaCuaHang>>(
        "/danhgia/cuahang",
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi tạo đánh giá CH:", error);
      return null;
    }
  },

  // 2. Lấy đánh giá cho CH
  getForCuaHang: async (
    MaCH: string,
    params?: { page?: number; limit?: number }
  ): Promise<any> => {
    try {
      const response = await api.get<ApiResponse<any>>(
        `/danhgia/cuahang/${MaCH}`,
        { params }
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi lấy đánh giá CH:", error);
      return null;
    }
  },

  // 3. Cập nhật đánh giá
  update: async (
    MaDG: string,
    data: Partial<DanhGiaCuaHang>
  ): Promise<DanhGiaCuaHang | null> => {
    try {
      const response = await api.put<ApiResponse<DanhGiaCuaHang>>(
        `/danhgia/cuahang/${MaDG}`,
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi cập nhật đánh giá CH:", error);
      return null;
    }
  },

  // 4. Xóa đánh giá
  delete: async (MaDG: string): Promise<boolean> => {
    try {
      await api.delete(`/danhgia/cuahang/${MaDG}`);
      return true;
    } catch (error: any) {
      console.error("Lỗi xóa đánh giá CH:", error);
      return false;
    }
  },

  // 5. Lấy đánh giá của tôi cho CH
  getMyForCuaHang: async (MaCH: string): Promise<DanhGiaCuaHang | null> => {
    try {
      const response = await api.get<ApiResponse<DanhGiaCuaHang>>(
        `/danhgia/my/cuahang/${MaCH}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi lấy đánh giá của tôi CH:", error);
      return null;
    }
  },

  // 6. Thống kê đánh giá CH
  getThongKe: async (MaCH: string): Promise<any | null> => {
    try {
      const response = await api.get<ApiResponse<any>>(
        `/danhgia/thongke/cuahang/${MaCH}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi thống kê đánh giá CH:", error);
      return null;
    }
  },

  // 7. Tất cả đánh giá của tôi
  getAllMy: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<any> => {
    try {
      const response = await api.get<ApiResponse<any>>(
        "/danhgia/my/all/cuahang",
        { params }
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi lấy tất cả đánh giá của tôi:", error);
      return null;
    }
  },
};
