// src/services/deliveryService.ts
import { api } from "./api";
import type { ApiResponse } from "./api";

// --- TYPES ---
export interface DeliveryTask {
  MaGH: string; // Mã Giao Hàng
  MaDH: string; // Mã Đơn Hàng
  StoreName: string; // Tên cửa hàng lấy
  StoreAddress: string;
  DeliveryAddress: string; // Địa chỉ khách
  CustomerName: string;
  CustomerPhone: string;
  CodAmount: number; // Tiền thu hộ
  ProductCount: number;
  Weight: number; // kg
  TrangThai:
    | "ASSIGNED"
    | "PICKED_UP"
    | "DELIVERED_BY_SHIPPER"
    | "COMPLETED"
    | "FAILED";
  GhiChu?: string;
  NgayTao: string;
}

export const deliveryService = {
  getMyTasks: async (type: "pickup" | "delivery" | "history") => {
    try {
      // Gọi vào employee controller để lấy danh sách đã filter
      const resp = await api.get("/employee/deliveries", {
        params: { type },
      });
      return resp.data.data;
    } catch (error: any) {
      console.error("Lỗi lấy danh sách nhiệm vụ:", error);
      return [];
    }
  },

  // 2. Nhận đơn (Assign Shipper)
  takeOrder: async (MaDH: string) => {
    // Route này gọi deliveryController.shipperTakeOrder
    const res = await api.post("/delivery/take", { MaDH });
    return res.data;
  },

  // 3. Xác nhận đã lấy hàng (Pickup Confirm)
  confirmPickup: async (MaDH: string) => {
    // 👇 SỬA LẠI URL CHO ĐÚNG: /api/delivery/pickup
    const res = await api.post("/delivery/pickup", { MaDH });
    return res.data;
  },

  // 4. Giao hàng thành công & Upload Proof
  uploadProof: async (MaGH: string, file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    // Route này gọi deliveryController.shipperUploadProof
    const res = await api.post(`/delivery/${MaGH}/proof`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};
export default deliveryService;
