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
  // 1. Lấy danh sách nhiệm vụ của Shipper (Lấy hàng / Giao hàng / Lịch sử)
  // Backend cần API: GET /api/delivery/my-tasks?type=pickup|delivery|history
  getMyTasks: async (
    type: "pickup" | "delivery" | "history"
  ): Promise<DeliveryTask[]> => {
    try {
      // backend employee routes: /api/employee/deliveries
      if (type === "pickup") {
        const resp = await api.get("/employee/deliveries", {
          params: { available: true },
        });
        return resp.data.data as DeliveryTask[];
      }
      if (type === "delivery") {
        const resp = await api.get("/employee/deliveries");
        return resp.data.data as DeliveryTask[];
      }
      const resp = await api.get("/employee/deliveries");
      return resp.data.data as DeliveryTask[];
    } catch (error: any) {
      console.error("Lỗi lấy danh sách nhiệm vụ:", error);
      return [];
    }
  },

  // 2. Xác nhận đã lấy hàng từ Shop
  // Backend cần API: POST /api/delivery/pickup
  confirmPickup: async (MaDH: string): Promise<boolean> => {
    try {
      await api.post("/employee/deliveries/take", { MaDH });
      return true;
    } catch (error: any) {
      console.error("Lỗi xác nhận lấy hàng:", error);
      throw new Error(
        error.response?.data?.message || "Không thể xác nhận lấy hàng"
      );
    }
  },

  // 3. Giao hàng thành công & Upload Proof
  // API đã có: POST /api/delivery/:MaGH/proof
  uploadProof: async (MaGH: string, file: File): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append("proof", file);

      await api.put(`/employee/deliveries/${MaGH}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return true;
    } catch (error: any) {
      console.error("Lỗi upload proof:", error);
      throw new Error(
        error.response?.data?.message || "Lỗi upload ảnh bằng chứng"
      );
    }
  },

  // 4. Báo cáo giao hàng thất bại
  reportFailure: async (MaGH: string, reason: string): Promise<boolean> => {
    try {
      await api.post(`/delivery/${MaGH}/fail`, { reason });
      return true;
    } catch (error: any) {
      console.error("Lỗi báo cáo thất bại:", error);
      return false;
    }
  },
};

// --- MOCK DATA (Để test giao diện khi chưa có Backend) ---
const getMockTasks = (type: string): DeliveryTask[] => {
  if (type === "pickup") {
    return [
      {
        MaGH: "GH001",
        MaDH: "DH1023",
        StoreName: "Nông Sản Sạch Ba Vì",
        StoreAddress: "123 Đường Láng, HN",
        DeliveryAddress: "456 Cầu Giấy, HN",
        CustomerName: "Nguyen Van A",
        CustomerPhone: "0987654321",
        CodAmount: 0,
        ProductCount: 5,
        Weight: 2.5,
        TrangThai: "ASSIGNED",
        NgayTao: new Date().toISOString(),
      },
    ];
  }
  if (type === "delivery") {
    return [
      {
        MaGH: "GH002",
        MaDH: "DH9999",
        StoreName: "Rau Củ Đà Lạt",
        StoreAddress: "Đà Lạt",
        DeliveryAddress: "789 Nguyễn Trãi, Q1, HCM",
        CustomerName: "Tran Thi B",
        CustomerPhone: "0123456789",
        CodAmount: 550000,
        ProductCount: 2,
        Weight: 1.0,
        TrangThai: "PICKED_UP",
        NgayTao: new Date().toISOString(),
      },
    ];
  }
  return [];
};

export default deliveryService;
