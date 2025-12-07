// src/pages/admin/AdminProducts.tsx
import React, { useEffect, useState } from "react";
import { Search, Edit, Trash2, Plus, Box } from "lucide-react";
// Giả sử bạn tái sử dụng productService hoặc adminService
// import { adminService } from "@/services/adminService";

const AdminProducts = () => {
  const [products, setProducts] = useState<any[]>([]); // Dùng tạm any hoặc interface Product
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Gọi API lấy list sản phẩm ở đây
    // adminService.getProducts().then(...)
    // Tạm thời để mảng rỗng để test giao diện
    setProducts([
      {
        MaSP: "SP001",
        TenSP: "Gạo ST25",
        GiaBan: 25000,
        SLTon: 100,
        CuaHang: "Nông Sản Việt",
      },
      {
        MaSP: "SP002",
        TenSP: "Cà chua Đà Lạt",
        GiaBan: 15000,
        SLTon: 50,
        CuaHang: "Rau Sạch",
      },
    ]);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Sản phẩm</h2>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition">
          <Plus size={20} /> Thêm mới
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Thanh tìm kiếm */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Bảng dữ liệu */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Sản phẩm</th>
                <th className="px-6 py-4">Cửa hàng</th>
                <th className="px-6 py-4">Giá bán</th>
                <th className="px-6 py-4">Tồn kho</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((sp) => (
                <tr key={sp.MaSP} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                        <Box size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{sp.TenSP}</p>
                        <p className="text-xs text-gray-500">{sp.MaSP}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{sp.CuaHang}</td>
                  <td className="px-6 py-4 font-medium text-emerald-600">
                    {sp.GiaBan.toLocaleString()} ₫
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sp.SLTon > 10
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {sp.SLTon}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                      <Edit size={18} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
