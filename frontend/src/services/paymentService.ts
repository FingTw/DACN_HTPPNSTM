// src/services/paymentService.ts
import { api } from "./api";

export const paymentService = {
  // 1. Tạo giao dịch PayPal (Gọi Backend để lấy OrderID)
  createPayPalOrder: async (MaDH: string) => {
    try {
      const response = await api.post("/payment/paypal/create", { MaDH });
      // Lấy trực tiếp ID từ response backend
      return response.data.id;
    } catch (error) {
      console.error("Lỗi tạo PayPal Order:", error);
      throw error;
    }
  },

  // 2. Hoàn tất giao dịch (Gửi OrderID về Backend để capture)
  capturePayPalOrder: async (token: string, MaDH: string) => {
    try {
      const response = await api.post("/payment/paypal/capture", {
        token, // OrderID của PayPal
        MaDH,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi capture PayPal Order:", error);
      throw error;
    }
  },
};
