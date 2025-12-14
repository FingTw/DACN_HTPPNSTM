// src/pages/employee/WarehouseDashboard.tsx
import React, { useEffect, useState } from "react";
import {
  Package,
  Box,
  ArrowDownCircle,
  ArrowUpCircle,
  Search,
  CheckCircle,
  MapPin,
  Clock,
} from "lucide-react";
import { warehouseService } from "@/services/warehouseService";

// Interface cập nhật thêm trường Log
interface Order {
  MaDH: string;
  TenNguoiNhan: string;
  DiaChi: string;
  TongTien: number;
  TrangThai: string;
  NgayTao: string;
  chitiet_donhangs?: { MaSP_sanpham?: { TenSP: string } }[];
}

interface Warehouse {
  MaKho: string;
  TenKho: string;
}

const WarehouseDashboard = () => {
  const [activeTab, setActiveTab] = useState<"import" | "instock">("import");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchWarehouses = async () => {
      const data = await warehouseService.getAllWarehouses();
      setWarehouses(data);
      if (data.length > 0) setSelectedWarehouse(data[0].MaKho);
    };
    fetchWarehouses();
  }, []);

  const fetchOrders = async () => {
    if (!selectedWarehouse) return;
    setLoading(true);
    try {
      const type = activeTab === "import" ? "INCOMING" : "IN_STOCK";
      const data = await warehouseService.getWarehouseOrders(
        type,
        selectedWarehouse
      );
      setOrders(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab, selectedWarehouse]);

  const handleProcess = async (
    orderId: string,
    action: "IMPORT" | "EXPORT"
  ) => {
    if (!selectedWarehouse) return alert("Chưa chọn kho!");
    if (
      !confirm(
        `Xác nhận ${action === "IMPORT" ? "Nhập" : "Xuất"} kho đơn ${orderId}?`
      )
    )
      return;

    try {
      setLoading(true);
      if (action === "IMPORT") {
        await warehouseService.importToWarehouse({
          MaDH: orderId,
          MaKho: selectedWarehouse,
        });
        alert("✅ Đã nhập kho thành công!");
      } else {
        await warehouseService.exportFromWarehouse({
          MaDH: orderId,
          MaKho: selectedWarehouse,
        });
        alert("🚚 Đã xuất kho thành công!");
      }
      fetchOrders();
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 p-4">
      {/* Header & Selector */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Box className="text-blue-600" /> QUẢN LÝ KHO
          </h1>
          <p className="text-sm text-gray-500">Khu vực làm việc hiện tại</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
          <MapPin className="text-orange-500" size={20} />
          <select
            className="bg-transparent font-bold text-gray-700 outline-none w-full md:w-48"
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
          >
            {warehouses.map((w) => (
              <option key={w.MaKho} value={w.MaKho}>
                {w.TenKho}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-200 rounded-xl gap-1">
        <button
          onClick={() => setActiveTab("import")}
          className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === "import"
              ? "bg-white text-green-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <ArrowDownCircle size={18} /> ĐƠN CHỜ NHẬP
        </button>
        <button
          onClick={() => setActiveTab("instock")}
          className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === "instock"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Box size={18} /> HÀNG TRONG KHO
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Tìm mã đơn, tên khách..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10">Đang tải...</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            <Package size={48} className="mb-2 opacity-20" />
            <p>Không có đơn hàng nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders
              .filter((o) =>
                JSON.stringify(o)
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())
              )
              .map((order) => (
                <div
                  key={order.MaDH}
                  className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-gray-800">
                      {order.MaDH}
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                      {new Date(order.NgayTao).toLocaleDateString("vi-VN")}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2 mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Khách:</span>{" "}
                      {order.TenNguoiNhan}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-1">
                      <span className="font-semibold">SP:</span>{" "}
                      {order.chitiet_donhangs?.[0]?.MaSP_sanpham?.TenSP}...
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin size={12} /> {order.DiaChi}
                    </p>
                  </div>

                  {activeTab === "import" ? (
                    <button
                      onClick={() => handleProcess(order.MaDH, "IMPORT")}
                      className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                    >
                      <ArrowDownCircle size={18} /> NHẬP KHO
                    </button>
                  ) : (
                    <button
                      onClick={() => handleProcess(order.MaDH, "EXPORT")}
                      className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                    >
                      <ArrowUpCircle size={18} /> XUẤT KHO
                    </button>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseDashboard;
