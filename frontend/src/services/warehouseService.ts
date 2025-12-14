// src/services/warehouseService.ts
import { api } from "./api";

export const warehouseService = {
  // Lấy danh sách tất cả các kho
  getAllWarehouses: async () => {
    try {
      const res = await api.get("/employee/warehouse/list");
      return res.data;
    } catch (error) {
      return [];
    }
  },

  // Lấy danh sách đơn hàng
  // type = 'INCOMING': Đơn chờ nhập
  // type = 'IN_STOCK': Đơn đang nằm trong kho (MaKho)
  getWarehouseOrders: async (type: "INCOMING" | "IN_STOCK", maKho: string) => {
    try {
      const response = await api.get("/employee/warehouse/orders", {
        params: { type, MaKho: maKho },
      });
      return response.data;
    } catch (error: any) {
      console.error("Lỗi lấy danh sách đơn hàng:", error);
      return [];
    }
  },

  importToWarehouse: async (data: any) => {
    const res = await api.post("/employee/warehouse/import-order", data);
    return res.data;
  },

  exportFromWarehouse: async (data: any) => {
    const res = await api.post("/employee/warehouse/export-order", data);
    return res.data;
  },
};
