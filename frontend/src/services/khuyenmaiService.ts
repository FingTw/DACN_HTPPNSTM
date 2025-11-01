// src/services/khuyenmaiService.ts
import { api } from "./api";
import type { ApiResponse } from "./api";

// ============================================
// TYPES
// ============================================

export interface KhuyenMai {
  MaKM: string;
  TenKM: string;
  MoTa: string;
  LoaiKM: string;
  GiaTriGiam: number;
  HinhThucGiam: string;
  DieuKien: string;
  SoTienGiamToiDa: number;
  NgayBatDau: string;
  NgayKetThuc: string;
  GioiHanSuDung: number;
  MaCH?: string;
}

// ============================================
// KHUYENMAI SERVICE
// ============================================

export const khuyenmaiService = {
  // 1. Tạo khuyến mãi
  create: async (data: Omit<KhuyenMai, "MaKM">): Promise<KhuyenMai | null> => {
    try {
      const response = await api.post<ApiResponse<KhuyenMai>>(
        "/khuyenmai",
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi tạo khuyến mãi:", error);
      return null;
    }
  },

  // 2. Lấy tất cả
  getAll: async (): Promise<KhuyenMai[] | null> => {
    try {
      const response = await api.get<ApiResponse<KhuyenMai[]>>("/khuyenmai");
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi lấy khuyến mãi:", error);
      return null;
    }
  },

  // 3. Cập nhật
  update: async (
    MaKM: string,
    data: Partial<KhuyenMai>
  ): Promise<KhuyenMai | null> => {
    try {
      const response = await api.put<ApiResponse<KhuyenMai>>(
        `/khuyenmai/${MaKM}`,
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi cập nhật khuyến mãi:", error);
      return null;
    }
  },

  // 4. Xóa
  delete: async (MaKM: string): Promise<boolean> => {
    try {
      await api.delete(`/khuyenmai/${MaKM}`);
      return true;
    } catch (error: any) {
      console.error("Lỗi xóa khuyến mãi:", error);
      return false;
    }
  },

  // 5. Gán cho user
  assignToUser: async (MaKM: string, MaTK: number): Promise<any | null> => {
    try {
      const response = await api.post<ApiResponse<any>>("/khuyenmai/assign", {
        MaKM,
        MaTK,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi gán khuyến mãi:", error);
      return null;
    }
  },

  // 6. Lấy khuyến mãi của user
  getUserKhuyenMai: async (): Promise<any[] | null> => {
    try {
      const response = await api.get<ApiResponse<any[]>>("/khuyenmai/user");
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi lấy khuyến mãi user:", error);
      return null;
    }
  },
};
