// src/pages/employee/WarehouseDashboard.tsx
import React, { useState } from "react";
import {
  Box,
  ArrowDownCircle,
  ArrowUpCircle,
  Search,
  QrCode,
} from "lucide-react";
import { warehouseService } from "@/services/warehouseService";

const WarehouseDashboard = () => {
  const [activeTab, setActiveTab] = useState<"import" | "export" | "inventory">(
    "import"
  );
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);

  // Xử lý Nhập kho (Hàng từ Shop về Kho)
  const handleImport = async () => {
    if (!orderId) return alert("Vui lòng nhập mã đơn hàng");
    setLoading(true);
    try {
      alert(`✅ Đã nhập kho đơn hàng: ${orderId}`);
      setOrderId("");
    } catch (err) {
      alert("Lỗi nhập kho");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý Xuất kho (Giao cho Shipper)
  const handleExport = async () => {
    if (!orderId) return alert("Vui lòng nhập mã đơn hàng");
    // Thực tế sẽ cần chọn thêm Shipper để gán đơn
    setLoading(true);
    try {
      // await warehouseService.exportFromWarehouse({ MaDH: orderId, MaKho: 'KHO_HCM_01' });
      alert(`🚚 Đã xuất kho đơn hàng: ${orderId} cho Shipper`);
      setOrderId("");
    } catch (err) {
      alert("Lỗi xuất kho");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        {activeTab === "import" && "📥 Nhập Kho (Inbound)"}
        {activeTab === "export" && "📤 Xuất Kho (Outbound)"}
        {activeTab === "inventory" && "📦 Quản lý Tồn Kho"}
      </h2>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setActiveTab("import")}
          className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
            activeTab === "import"
              ? "border-green-500 bg-green-50 text-green-700"
              : "border-gray-200 bg-white hover:bg-gray-50"
          }`}
        >
          <ArrowDownCircle size={28} />
          <span className="font-bold">Nhập Hàng</span>
        </button>
        <button
          onClick={() => setActiveTab("export")}
          className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
            activeTab === "export"
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-gray-200 bg-white hover:bg-gray-50"
          }`}
        >
          <ArrowUpCircle size={28} />
          <span className="font-bold">Xuất Hàng</span>
        </button>
        <button
          onClick={() => setActiveTab("inventory")}
          className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
            activeTab === "inventory"
              ? "border-orange-500 bg-orange-50 text-orange-700"
              : "border-gray-200 bg-white hover:bg-gray-50"
          }`}
        >
          <Box size={28} />
          <span className="font-bold">Tồn Kho</span>
        </button>
      </div>

      {/* WORKSPACE */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        {/* Form Nhập/Xuất */}
        {(activeTab === "import" || activeTab === "export") && (
          <div className="space-y-6 max-w-lg mx-auto py-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode size={40} className="text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-700">
              Quét mã hoặc nhập Mã Đơn Hàng
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ví dụ: DH12345678"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
              <button className="px-4 bg-gray-200 rounded-xl hover:bg-gray-300">
                <QrCode />
              </button>
            </div>

            <button
              onClick={activeTab === "import" ? handleImport : handleExport}
              disabled={loading}
              className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-transform active:scale-95 ${
                activeTab === "import"
                  ? "bg-green-600 hover:bg-green-700 shadow-green-200"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
              }`}
            >
              {loading
                ? "Đang xử lý..."
                : activeTab === "import"
                ? "XÁC NHẬN NHẬP KHO"
                : "XÁC NHẬN XUẤT KHO"}
            </button>
          </div>
        )}

        {/* Bảng Tồn Kho */}
        {activeTab === "inventory" && (
          <div>
            <div className="flex justify-between mb-4">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                className="px-4 py-2 border rounded-lg w-64"
              />
              <button className="text-blue-600 font-medium">
                Xuất báo cáo
              </button>
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="p-3">Sản phẩm</th>
                  <th className="p-3">Khu vực</th>
                  <th className="p-3">Số lượng</th>
                  <th className="p-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50">
                  <td className="p-3 font-medium">Gạo ST25 (5kg)</td>
                  <td className="p-3 text-gray-500">Kệ A-01</td>
                  <td className="p-3 font-bold text-blue-600">50</td>
                  <td className="p-3">
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                      Sẵn sàng
                    </span>
                  </td>
                </tr>
                {/* Mock data rows */}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseDashboard;
