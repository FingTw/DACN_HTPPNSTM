// src/services/deliveryService.ts
import { api } from "./api";
import type { ApiResponse } from "./api";

// ============================================
// TYPES
// ============================================

export interface DeliveryRecord {
  MaGH: string;
  MaShipper: number;
  MaDH: string;
  TrangThai: string;
  GhiChu?: string;
  NgayTao: string;
  ProofImage?: string;
}

export interface AssignDeliveryData {
  MaDH: string;
  MaTK: number; // Shipper MaTK
  GhiChu?: string;
}

// ============================================
// DELIVERY SERVICE
// ============================================

export const deliveryService = {
  // 1. Admin gán Shipper
  assignDelivery: async (
    data: AssignDeliveryData
  ): Promise<DeliveryRecord | null> => {
    try {
      const response = await api.post<ApiResponse<DeliveryRecord>>(
        "/delivery/assign",
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi gán shipper:", error);
      return null;
    }
  },

  // 2. Shipper upload proof (multipart)
  uploadProof: async (
    MaGH: string,
    file: File
  ): Promise<DeliveryRecord | null> => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await api.post<ApiResponse<DeliveryRecord>>(
        `/delivery/${MaGH}/proof`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi upload proof:", error);
      return null;
    }
  },

  // 3. Khách hàng xác nhận nhận hàng
  confirmDelivery: async (MaGH: string): Promise<DeliveryRecord | null> => {
    try {
      const response = await api.post<ApiResponse<DeliveryRecord>>(
        `/delivery/${MaGH}/confirm`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi xác nhận nhận hàng:", error);
      return null;
    }
  },
};
