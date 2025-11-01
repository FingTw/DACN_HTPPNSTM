// src/services/cartService.ts
import { api } from "./api";
import type { ApiResponse } from "./api";

// ============================================
// TYPES
// ============================================

export interface CartItem {
  MaSP: string;
  SL: number;
  TongTien: number;
}

// ============================================
// CART SERVICE
// ============================================

export const cartService = {
  // 1. Thêm vào giỏ
  addToCart: async (data: {
    MaSP: string;
    quantity?: number;
  }): Promise<boolean> => {
    try {
      await api.post("/cart/add", data);
      return true;
    } catch (error: any) {
      console.error("Lỗi thêm vào giỏ:", error);
      return false;
    }
  },

  // 2. Cập nhật số lượng
  updateQuantity: async (data: {
    MaSP: string;
    quantity: number;
  }): Promise<any | null> => {
    try {
      const response = await api.put<ApiResponse<any>>(
        "/cart/update-quantity",
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi cập nhật số lượng:", error);
      return null;
    }
  },

  // 3. Xóa khỏi giỏ
  removeFromCart: async (MaSP: string): Promise<boolean> => {
    try {
      await api.post("/cart/remove", { MaSP });
      return true;
    } catch (error: any) {
      console.error("Lỗi xóa khỏi giỏ:", error);
      return false;
    }
  },

  // 4. Lấy số lượng giỏ
  getCount: async (): Promise<number> => {
    try {
      const response = await api.get<ApiResponse<{ count: number }>>(
        "/cart/count"
      );
      return response.data.data.count;
    } catch (error: any) {
      console.error("Lỗi lấy số lượng giỏ:", error);
      return 0;
    }
  },
};
