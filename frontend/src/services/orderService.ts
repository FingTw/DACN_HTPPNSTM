// src/services/orderService.ts
import { api } from "./api";
import type { ApiResponse } from "./api";

// ============================================
// TYPES
// ============================================

export interface OrderItem {
  MaSP: string;
  SoLuong: number;
  GiaBan: number;
}

export interface ProcessCheckoutData {
  DCNhanHang: string;
  MaPTVC: string;
  MaPTTT: string;
  items: OrderItem[];
}

export interface Order {
  MaDH: string;
  TrangThai: string;
  // ... other fields
}

// ============================================
// ORDER SERVICE
// ============================================

export const orderService = {
  // 1. Checkout giỏ hàng
  checkout: async (): Promise<any[] | null> => {
    try {
      const response = await api.get<ApiResponse<any[]>>("/order/checkout");
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi checkout:", error);
      return null;
    }
  },

  // 2. Checkout item cụ thể
  checkoutItem: async (MaSP: string): Promise<any | null> => {
    try {
      const response = await api.post<ApiResponse<any>>(
        "/order/checkout-item",
        { MaSP }
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi checkout item:", error);
      return null;
    }
  },

  // 3. Xử lý checkout
  processCheckout: async (data: ProcessCheckoutData): Promise<Order | null> => {
    try {
      const response = await api.post<ApiResponse<Order>>(
        "/order/process",
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi process checkout:", error);
      return null;
    }
  },

  // 4. Lấy đơn hàng của tôi
  getMyOrders: async (): Promise<Order[] | null> => {
    try {
      const response = await api.get<ApiResponse<Order[]>>("/order/my-orders");
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi lấy đơn hàng:", error);
      return null;
    }
  },

  // 5. Cập nhật trạng thái đơn hàng
  updateOrderStatus: async (
    MaDH: string,
    TrangThai: string
  ): Promise<boolean> => {
    try {
      await api.put(`/order/${MaDH}/status`, { TrangThai });
      return true;
    } catch (error: any) {
      console.error("Lỗi cập nhật trạng thái:", error);
      return false;
    }
  },
};
