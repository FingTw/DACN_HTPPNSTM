import React, { useState } from "react";
import type { Store, StoreFormData } from "./store";

interface StoreManagerProps {
  store: Store;
  isOwner: boolean;
  onStoreUpdate?: (updatedStore: Store) => void;
}

const StoreManager: React.FC<StoreManagerProps> = ({
  store,
  isOwner,
  onStoreUpdate,
}) => {
  const formatCurrency = (value?: number | string) => {
    const num = Number(value || 0);
    return num.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  };

  const [editing, setEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<StoreFormData>({
    TenCH: store?.TenCH || "",
    DCLayHang: store?.DCLayHang || "",
    MoTa: store?.MoTa || "",
  });
  const [loading, setLoading] = useState<boolean>(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev: StoreFormData) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateStore = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/api/cuahang/${store.MaCH}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (data.success) {
        setEditing(false);
        onStoreUpdate?.(data.data);
        alert("Cập nhật thông tin thành công!");
      } else {
        alert(data.message || "Lỗi khi cập nhật thông tin");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật cửa hàng:", error);
      alert("Lỗi khi cập nhật thông tin");
    } finally {
      setLoading(false);
    }
  };

  if (!isOwner) return null;

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          🏪 Quản lý Cửa hàng
        </h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200"
          >
            ✏️ Chỉnh sửa
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleUpdateStore}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên cửa hàng *
              </label>
              <input
                type="text"
                name="TenCH"
                value={formData.TenCH}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ lấy hàng
              </label>
              <input
                type="text"
                name="DCLayHang"
                value={formData.DCLayHang}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả cửa hàng
              </label>
              <textarea
                name="MoTa"
                value={formData.MoTa}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Giới thiệu về cửa hàng, sản phẩm đặc trưng..."
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white py-2 rounded-xl font-semibold transition-all duration-200"
            >
              {loading ? "Đang cập nhật..." : "Lưu thay đổi"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setFormData({
                  TenCH: store?.TenCH || "",
                  DCLayHang: store?.DCLayHang || "",
                  MoTa: store?.MoTa || "",
                });
              }}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-xl font-semibold transition-all duration-200"
            >
              Hủy
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            <span className="text-sm font-medium text-emerald-700">
              Số dư ví cửa hàng
            </span>
            <span className="text-lg font-bold text-emerald-700">
              {formatCurrency(store.SoDu)}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên cửa hàng
            </label>
            <div className="text-lg text-gray-900">{store.TenCH}</div>
          </div>

          {store.DCLayHang && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ lấy hàng
              </label>
              <div className="text-lg text-gray-900">{store.DCLayHang}</div>
            </div>
          )}

          {store.MoTa && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <div className="text-lg text-gray-900 whitespace-pre-wrap">
                {store.MoTa}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StoreManager;
