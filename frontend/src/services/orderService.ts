// src/services/orderService.ts
import { api } from "./api";
import type { ApiResponse } from "./api";

// ============================================
// TYPES
// ============================================

export interface OrderItem {
  MaSP: string;
  SL: number;
  GiaBan: number;
}

export interface ProcessCheckoutData {
  DCNhanHang: string;
  MaPTVC: string | null;
  MaPTTT: string | null;
  TongTien: number;
  items: OrderItem[];
}

export interface Order {
  MaDH: string;
  TrangThai: string;
  TongTien: number;
  NgayTao: string;
  DCNhanHang: string;
  chitiet_donhangs?: Array<{
    MaSP: string;
    TenSP: string;
    SoLuong: number;
    GiaBan: number;
  }>;
}

export interface ShippingMethod {
  MaPTVC: string;
  TenPTVC: string;
  PhiVanChuyen?: number;
}

export interface PaymentMethod {
  MaPTTT: string;
  TenPTTT: string;
}

// ============================================
// ORDER SERVICE - SỬA ENDPOINTS
// ============================================

export const orderService = {
  // 1. Checkout giỏ hàng - SỬA ENDPOINT
  checkout: async (): Promise<any[] | null> => {
    try {
      const response = await api.get<ApiResponse<any[]>>("/order/checkout"); // ← SỬA /order/checkout → /orders/checkout
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi checkout:", error);
      return null;
    }
  },

  // 2. Checkout item cụ thể - SỬA ENDPOINT
  checkoutItem: async (MaSP: string): Promise<any | null> => {
    try {
      const response = await api.post<ApiResponse<any>>(
        "/order/checkout-item", // ← SỬA /order/checkout-item → /orders/checkout-item
        { MaSP }
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi checkout item:", error);
      return null;
    }
  },

  // 3. Xử lý checkout - SỬA ENDPOINT QUAN TRỌNG
// src/services/orderService.ts - SỬA XỬ LÝ UNDEFINED
processCheckout: async (data: ProcessCheckoutData): Promise<Order | null> => {
  try {
    console.log('🔄 Calling endpoint: POST /order/process-checkout');
    const response = await api.post("/order/process-checkout", data);
    
    console.log('📨 Raw response:', response);
    console.log('📨 Response data:', response.data);
    
    // KIỂM TRA KỸ CÁC TRƯỜNG HỢP
    if (!response.data) {
      console.log('❌ Response data is completely undefined');
      throw new Error('Không nhận được phản hồi từ server');
    }
    
    if (response.data.success === false) {
      console.log('❌ Backend returned success: false');
      throw new Error(response.data.message || 'Đặt hàng thất bại');
    }
    
    if (response.data.data) {
      console.log('✅ Backend returned data:', response.data.data);
      return response.data.data;
    }
    
    // Trường hợp backend trả về data trực tiếp (không wrap)
    if (response.data.MaDH) {
      console.log('✅ Backend returned direct order data');
      return response.data;
    }
    
    console.log('❌ No valid data in response');
    throw new Error('Phản hồi từ server không hợp lệ');
    
  } catch (error: any) {
    console.error("❌ Lỗi process checkout:");
    console.error("- Error:", error.message);
    console.error("- Response:", error.response?.data);
    
    // Backend có thể đã tạo đơn hàng nhưng trả về lỗi
    // Trong trường hợp này, chúng ta vẫn cần thông báo cho user
    throw new Error(error.response?.data?.message || error.message || 'Đặt hàng thất bại');
  }
},

  // 4. Lấy đơn hàng của tôi - SỬA ENDPOINT
  getMyOrders: async (): Promise<Order[] | null> => {
    try {
      const response = await api.get<ApiResponse<Order[]>>("/order/my-orders"); // ← THÊM ENDPOINT NÀY NẾU CÓ
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi lấy đơn hàng:", error);
      return null;
    }
  },

  // 5. Lấy chi tiết đơn hàng thành công - THÊM METHOD MỚI
  getOrderSuccess: async (MaDH: string): Promise<Order | null> => {
    try {
      const response = await api.get<ApiResponse<Order>>(`/order/order-success/${MaDH}`);
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi lấy chi tiết đơn hàng:", error);
      return null;
    }
  },

  // 6. Cập nhật trạng thái đơn hàng - SỬA ENDPOINT
  updateOrderStatus: async (
    MaDH: string,
    TrangThai: string
  ): Promise<boolean> => {
    try {
      await api.put(`/order/update-status/${MaDH}`, { TrangThai }); // ← SỬA /order/{MaDH}/status → /orders/update-status/{MaDH}
      return true;
    } catch (error: any) {
      console.error("Lỗi cập nhật trạng thái:", error);
      return false;
    }
  },
  // 🆕 7. Lấy danh sách phương thức vận chuyển
  getShippingMethods: async (): Promise<ShippingMethod[] | null> => {
    try {
      // Thử endpoint mới
      const response = await api.get<ApiResponse<ShippingMethod[]>>("/order/shipping-methods");
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi lấy phương thức vận chuyển:", error);
      // Fallback: trả về giá trị mặc định
      return [
        { MaPTVC: 'VC01', TenPTVC: 'Giao hàng nhanh', PhiVanChuyen: 30000 },
        { MaPTVC: 'VC02', TenPTVC: 'Giao hàng hỏa tốc', PhiVanChuyen: 50000 },
        // { MaPTVC: 'VC03', TenPTVC: 'Giao hàng siêu tốc', PhiVanChuyen: 80000 }
      ];
    }
  },

  // 🆕 8. Lấy danh sách phương thức thanh toán
  getPaymentMethods: async (): Promise<PaymentMethod[] | null> => {
    try {
      // Thử endpoint mới
      const response = await api.get<ApiResponse<PaymentMethod[]>>("/order/payment-methods");
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi lấy phương thức thanh toán:", error);
      // Fallback: trả về giá trị mặc định
      return [
        { MaPTTT: 'TT01', TenPTTT: 'Thanh toán khi nhận hàng (COD)' },
        { MaPTTT: 'TT02', TenPTTT: 'Chuyển khoản ngân hàng' },
        // { MaPTTT: 'TT03', TenPTTT: 'Ví điện tử' }
      ];
    }
  },
};
