// src/services/warehouseService.ts
import { api } from "./api";
import type { ApiResponse } from "./api";

export interface WarehouseTicket {
  MaXNT: string;
  LoaiPhieu: "NHAP" | "XUAT";
  MaDH?: string;
  MaKho: string;
  NguoiThucHien: string;
  NgayTao: string;
  ChiTiet?: any[];
}

export const warehouseService = {
  // 1. Nhập kho (Inbound)
  // Backend cần API: POST /api/warehouse/import
  importToWarehouse: async (data: {
    MaDH: string;
    MaKho: string;
    GhiChu?: string;
  }) => {
    try {
      const response = await api.post<ApiResponse<WarehouseTicket>>(
        "/warehouse/import",
        data
      );
      return response.data;
    } catch (error: any) {
      console.error("Lỗi nhập kho:", error);
      throw new Error(error.response?.data?.message || "Lỗi nhập kho");
    }
  },

  // 2. Xuất kho giao Shipper (Outbound)
  // Backend cần API: POST /api/warehouse/export
  exportFromWarehouse: async (data: {
    MaDH: string;
    MaKho: string;
    MaShipper?: string;
    GhiChu?: string;
  }) => {
    try {
      const response = await api.post<ApiResponse<WarehouseTicket>>(
        "/warehouse/export",
        data
      );
      return response.data;
    } catch (error: any) {
      console.error("Lỗi xuất kho:", error);
      throw new Error(error.response?.data?.message || "Lỗi xuất kho");
    }
  },

  // 3. Lấy tồn kho hiện tại
  // Backend cần API: GET /api/warehouse/inventory
  getInventory: async (MaKho: string, search: string = "") => {
    try {
      const response = await api.get("/warehouse/inventory", {
        params: { MaKho, search },
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi lấy tồn kho:", error);
      // Mock data
      return [
        { MaSP: "SP01", TenSP: "Gạo ST25", SLTon: 150, ViTri: "Khu A-01" },
        { MaSP: "SP02", TenSP: "Cà phê hạt", SLTon: 50, ViTri: "Khu B-03" },
      ];
    }
  },
};

export default warehouseService;
