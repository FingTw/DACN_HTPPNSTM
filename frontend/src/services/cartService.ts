// // src/services/cartService.ts
// import { api } from "./api";
// import type { ApiResponse } from "./api";

// // ============================================
// // TYPES
// // ============================================

// export interface CartItem {
//   MaSP: string;
//   SL: number;
//   TongTien: number;
// }

// // ============================================
// // CART SERVICE
// // ============================================

// export const cartService = {
//   // 1. Thêm vào giỏ
//   addToCart: async (data: {
//     MaSP: string;
//     quantity?: number;
//   }): Promise<boolean> => {
//     try {
//       await api.post("/cart/add", data);
//       return true;
//     } catch (error: any) {
//       console.error("Lỗi thêm vào giỏ:", error);
//       return false;
//     }
//   },

//   // 2. Cập nhật số lượng
//   updateQuantity: async (data: {
//     MaSP: string;
//     quantity: number;
//   }): Promise<any | null> => {
//     try {
//       const response = await api.put<ApiResponse<any>>(
//         "/cart/update-quantity",
//         data
//       );
//       return response.data.data;
//     } catch (error: any) {
//       console.error("Lỗi cập nhật số lượng:", error);
//       return null;
//     }
//   },

//   // 3. Xóa khỏi giỏ
//   removeFromCart: async (MaSP: string): Promise<boolean> => {
//     try {
//       await api.post("/cart/remove", { MaSP });
//       return true;
//     } catch (error: any) {
//       console.error("Lỗi xóa khỏi giỏ:", error);
//       return false;
//     }
//   },

//   // 4. Lấy số lượng giỏ
//   getCount: async (): Promise<number> => {
//     try {
//       const response = await api.get<ApiResponse<{ count: number }>>(
//         "/cart/count"
//       );
//       return response.data.data.count;
//     } catch (error: any) {
//       console.error("Lỗi lấy số lượng giỏ:", error);
//       return 0;
//     }
//   },
// };
import api from './api';

export interface CartItem {
  MaGH: string;
  MaSP: string;
  SL: number;
  TongTien: number;
  sanpham: {
    MaSP: string;
    TenSP: string;
    GiaBan: number;
    SLTon: number;
    HinhAnh: string;
    MoTa?: string;
  };
}

export interface CartResponse {
  success: boolean;
  cart: {
    MaGH: string;
    MaTK: string;
  } | null;
  items: CartItem[];
  total: number;
}

class CartService {
  // 🛒 Lấy toàn bộ giỏ hàng
  async getCart(): Promise<CartResponse> {
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { success: true, cart: null, items: [], total: 0 };
      }
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy giỏ hàng');
    }
  }
  
  // 🛒 Thêm sản phẩm vào giỏ hàng
  async addToCart(MaSP: string, quantity: number = 1): Promise<CartResponse> {
    try {
      const response = await api.post('/cart/add', { MaSP, quantity });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Lỗi khi thêm vào giỏ hàng');
    }
  }

  // 🔄 Cập nhật số lượng sản phẩm
  async updateQuantity(MaSP: string, quantity: number): Promise<CartResponse> {
    try {
      const response = await api.post('/cart/update', { MaSP, quantity });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật giỏ hàng');
    }
  }

  // ❌ Xóa sản phẩm khỏi giỏ hàng
  async removeFromCart(MaSP: string): Promise<CartResponse> {
    try {
      const response = await api.post('/cart/remove', { MaSP });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Lỗi khi xóa khỏi giỏ hàng');
    }
  }

  // 🔢 Lấy tổng số lượng sản phẩm trong giỏ
  async getCartCount(): Promise<{ count: number }> {
    try {
      const response = await api.get('/cart/count');
      return response.data;
    } catch (error: any) {
      // Nếu lỗi auth, trả về count = 0
      if (error.response?.status === 401) {
        return { count: 0 };
      }
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy số lượng giỏ hàng');
    }
  }
}

export default new CartService();