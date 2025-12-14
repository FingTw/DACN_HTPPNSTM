// src/pages/admin/AdminShops.tsx
import React, { useEffect, useState } from "react";
import { adminService, type Shop } from "@/services/adminService";
import { Store, CheckCircle, XCircle } from "lucide-react";

const AdminShops = () => {
  const [shops, setShops] = useState<Shop[]>([]);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const data = await adminService.getShops();
        setShops(data.shops || []);
      } catch (error) {
        console.error("Lỗi lấy danh sách shop:", error);
      }
    };
    fetchShops();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Danh sách Cửa hàng</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {shops.map((shop) => (
          <div
            key={shop.MaCH}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                  <Store size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{shop.TenCH}</h3>
                  <p className="text-xs text-gray-500">Chủ: {shop.ChuSoHuu}</p>
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                  shop.TrangThai === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {shop.TrangThai}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 mt-2">
              <div>
                <p className="text-xs text-gray-500">Sản phẩm</p>
                <p className="font-bold text-gray-800">{shop.SLSanPham}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Ngày tạo</p>
                <p className="font-bold text-gray-800">
                  {new Date(shop.NgayTao).toLocaleDateString("vi-VN")}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
                <CheckCircle size={16} /> Duyệt
              </button>
              <button className="flex-1 bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-700 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
                <XCircle size={16} /> Khóa
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminShops;
