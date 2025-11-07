// components/cuahang/CuahangEditForm.tsx
import React, { useState, useEffect } from "react";

interface Store {
  MaCH: string;
  TenCH: string;
  MoTa?: string;
  SLTheoDoi: number;
  DiemDG: number;
  DCLayHang?: string;
  NgayTao?: string;
  MaTK: string;
  MaHA_CuaHang?: string;
  MaHA_CuaHang_hinhanh?: {
    URL: string;
    MoTa?: string;
  };
  hdbanhang?: {
    LoaiHinhKD: string;
    MaSoThue?: string;
    DCLayHang?: string;
  };
}

interface CuahangEditFormProps {
  store: Store;
  onUpdate: (data: any) => Promise<{ success: boolean; message: string }>;
  onCancel: () => void;
}

const CuahangEditForm: React.FC<CuahangEditFormProps> = ({
  store,
  onUpdate,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    TenCH: store.TenCH || "",
    MoTa: store.MoTa || "",
    DCLayHang: store.DCLayHang || "",
    MaHA_CuaHang: store.MaHA_CuaHang || "",
    LoaiHinhKD: store.hdbanhang?.LoaiHinhKD || "",
    MaSoThue: store.hdbanhang?.MaSoThue || "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Các loại hình kinh doanh
  const loaiHinhKDOptions = [
    "Bán buôn và bán lẻ",
    "Bán buôn",
    "Bán lẻ",
    "Sản xuất và bán buôn",
    "Sản xuất và bán lẻ",
    "Dịch vụ",
    "Khác",
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // 🟢 CHUẨN BỊ DỮ LIỆU GỬI LÊN
      const updateData = {
        TenCH: formData.TenCH,
        MoTa: formData.MoTa,
        DCLayHang: formData.DCLayHang,
        MaHA_CuaHang: formData.MaHA_CuaHang || null,
        LoaiHinhKD: formData.LoaiHinhKD,
        MaSoThue: formData.MaSoThue,
      };

      console.log("📤 Dữ liệu gửi lên server:", updateData);

      const result = await onUpdate(updateData);

      if (result.success) {
        setMessage({ type: "success", text: result.message });
        // Tự động ẩn thông báo sau 3 giây
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Đã xảy ra lỗi khi cập nhật",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 px-8 py-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">
          Chỉnh sửa thông tin cửa hàng
        </h2>
        <p className="text-gray-600 mt-1">
          Cập nhật thông tin cửa hàng của bạn
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mx-8 mt-6 p-4 rounded-xl ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          <div className="flex items-center">
            <span
              className={`mr-2 text-lg ${
                message.type === "success" ? "✅" : "❌"
              }`}
            >
              {message.type === "success" ? "✅" : "❌"}
            </span>
            {message.text}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* Thông tin cơ bản */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cột trái - Thông tin cửa hàng */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm mr-2">
                  🏪
                </span>
                Thông tin cửa hàng
              </h3>

              {/* Tên cửa hàng */}
              <div className="mb-6">
                <label
                  htmlFor="TenCH"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tên cửa hàng *
                </label>
                <input
                  type="text"
                  id="TenCH"
                  name="TenCH"
                  value={formData.TenCH}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  placeholder="Nhập tên cửa hàng"
                />
              </div>

              {/* Mô tả */}
              <div className="mb-6">
                <label
                  htmlFor="MoTa"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Mô tả cửa hàng
                </label>
                <textarea
                  id="MoTa"
                  name="MoTa"
                  value={formData.MoTa}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white resize-none"
                  placeholder="Mô tả về cửa hàng của bạn..."
                />
              </div>

              {/* Mã hình ảnh */}
              <div>
                <label
                  htmlFor="MaHA_CuaHang"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Mã hình ảnh cửa hàng
                </label>
                <input
                  type="text"
                  id="MaHA_CuaHang"
                  name="MaHA_CuaHang"
                  value={formData.MaHA_CuaHang}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  placeholder="Nhập mã hình ảnh (ví dụ: HA001)"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Mã hình ảnh từ hệ thống (nếu có)
                </p>
              </div>
            </div>
          </div>

          {/* Cột phải - Thông tin kinh doanh */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm mr-2">
                  💼
                </span>
                Thông tin kinh doanh
              </h3>

              {/* Loại hình kinh doanh */}
              <div className="mb-6">
                <label
                  htmlFor="LoaiHinhKD"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Loại hình kinh doanh *
                </label>
                <select
                  id="LoaiHinhKD"
                  name="LoaiHinhKD"
                  value={formData.LoaiHinhKD}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                >
                  <option value="">Chọn loại hình kinh doanh</option>
                  {loaiHinhKDOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mã số thuế */}
              <div className="mb-6">
                <label
                  htmlFor="MaSoThue"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Mã số thuế
                </label>
                <input
                  type="text"
                  id="MaSoThue"
                  name="MaSoThue"
                  value={formData.MaSoThue}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                  placeholder="Nhập mã số thuế (10-13 số)"
                  pattern="[0-9]{10,13}"
                  title="Mã số thuế phải có 10-13 chữ số"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Định dạng: 10-13 chữ số
                </p>
              </div>

              {/* Địa chỉ lấy hàng */}
              <div>
                <label
                  htmlFor="DCLayHang"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Địa chỉ lấy hàng *
                </label>
                <input
                  type="text"
                  id="DCLayHang"
                  name="DCLayHang"
                  value={formData.DCLayHang}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                  placeholder="Nhập địa chỉ lấy hàng đầy đủ"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Địa chỉ đầy đủ để khách hàng đến lấy hàng
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Thông tin hiện tại */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm mr-2">
              📋
            </span>
            Thông tin hiện tại
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Mã cửa hàng:</span>
              <span className="ml-2 text-gray-800 font-mono">{store.MaCH}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Ngày tạo:</span>
              <span className="ml-2 text-gray-800">
                {store.NgayTao
                  ? new Date(store.NgayTao).toLocaleDateString("vi-VN")
                  : "Chưa có thông tin"}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-600">
                Số lượt theo dõi:
              </span>
              <span className="ml-2 text-gray-800">
                {store.SLTheoDoi?.toLocaleString() || 0}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Điểm đánh giá:</span>
              <span className="ml-2 text-gray-800">
                {store.DiemDG?.toFixed(1) || "0.0"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Đang lưu...
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CuahangEditForm;
