// components/cuahang/CuahangEditForm.tsx
import React, { useState, useEffect } from "react";
import {
  Camera,
  Store as StoreIcon,
  MapPin,
  Briefcase,
  CreditCard,
  Save,
  X,
} from "lucide-react";

interface Store {
  MaCH: string;
  TenCH: string;
  SLTheoDoi: number;
  DiemDG: number;
  DCLayHang?: string;
  NgayTao?: string;
  MaTK: string;
  MaHA_CuaHang?: string;

  // Backend trả về MaHA_CuaHang_hinhanh
  MaHA_CuaHang_hinhanh?: {
    URL: string;
    MoTa?: string;
  };

  // ⚠️ QUAN TRỌNG: Backend trả về tên này (MaHD_hdbanhang)
  MaHD_hdbanhang?: {
    LoaiHinhKD: string;
    MaSoThue?: string;
    DCLayHang?: string;
  };

  // Giữ lại cái này đề phòng trường hợp bạn sửa backend
  hdbanhang?: {
    LoaiHinhKD: string;
    MaSoThue?: string;
    DCLayHang?: string;
  };
}

interface CuahangEditFormProps {
  store: Store;
  onUpdate: (data: FormData) => Promise<{ success: boolean; message: string }>;
  onCancel: () => void;
}

const CuahangEditForm: React.FC<CuahangEditFormProps> = ({
  store,
  onUpdate,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    TenCH: "",
    DCLayHang: "",
    LoaiHinhKD: "",
    MaSoThue: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loaiHinhKDOptions = [
    "Bán buôn và bán lẻ",
    "Bán buôn",
    "Bán lẻ",
    "Sản xuất và bán buôn",
    "Sản xuất và bán lẻ",
    "Dịch vụ",
    "Khác",
  ];

  // Load dữ liệu từ store vào form
  useEffect(() => {
    if (store) {
      console.log("📦 Dữ liệu store nhận được:", store); // Log để kiểm tra

      // ✅ FIX: Lấy dữ liệu từ MaHD_hdbanhang HOẶC hdbanhang
      const contractData = store.MaHD_hdbanhang || store.hdbanhang;

      setFormData({
        TenCH: store.TenCH || "",
        // Lấy thông tin từ hợp đồng (ưu tiên lấy từ object contractData vừa tìm được)
        DCLayHang: contractData?.DCLayHang || store.DCLayHang || "",
        LoaiHinhKD: contractData?.LoaiHinhKD || "",
        MaSoThue: contractData?.MaSoThue || "",
      });

      // Xử lý ảnh preview
      if (store.MaHA_CuaHang_hinhanh?.URL) {
        const url = store.MaHA_CuaHang_hinhanh.URL;
        const fullUrl = url.startsWith("http")
          ? url
          : `http://localhost:3000${url}`;
        setPreviewUrl(fullUrl);
      }
    }
  }, [store]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

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
      const data = new FormData();
      data.append("TenCH", formData.TenCH);
      // Gửi các trường này lên, Controller đã được sửa ở bước trước để hứng và update vào bảng hợp đồng
      data.append("DCLayHang", formData.DCLayHang);
      data.append("LoaiHinhKD", formData.LoaiHinhKD);
      data.append("MaSoThue", formData.MaSoThue);

      if (selectedFile) {
        data.append("image", selectedFile);
      }

      const result = await onUpdate(data);

      if (result.success) {
        setMessage({ type: "success", text: result.message });
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
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Chỉnh sửa cửa hàng</h2>
            <p className="text-blue-100 text-sm mt-1 opacity-90">
              Cập nhật thông tin hiển thị và thông tin kinh doanh
            </p>
          </div>
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            <StoreIcon className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Thông báo */}
      {message && (
        <div
          className={`mx-8 mt-6 p-4 rounded-xl flex items-center gap-3 shadow-sm animate-fade-in-down ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          <span className="text-xl">
            {message.type === "success" ? "✅" : "❌"}
          </span>
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-8">
        <div className="flex flex-col md:flex-row gap-10">
          {/* Cột Trái: Ảnh đại diện */}
          <div className="md:w-1/3 flex flex-col items-center">
            <label className="block text-sm font-semibold text-gray-700 mb-4 self-start md:self-center">
              Logo Cửa Hàng
            </label>

            <div className="relative group cursor-pointer">
              <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-gray-100 shadow-lg relative bg-gray-50">
                <img
                  src={previewUrl || "https://placehold.co/200?text=Logo"}
                  alt="Store Logo"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Camera className="w-10 h-10 text-white drop-shadow-md" />
                </div>
              </div>

              <div className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full shadow-md group-hover:bg-blue-700 transition-colors">
                <Camera className="w-5 h-5" />
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center max-w-[200px]">
              Nhấn vào ảnh để tải lên logo mới.
            </p>
          </div>

          {/* Cột Phải: Form nhập liệu */}
          <div className="md:w-2/3 space-y-6">
            {/* Tên cửa hàng */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <StoreIcon className="w-4 h-4 text-blue-500" />
                Tên cửa hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="TenCH"
                value={formData.TenCH}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                placeholder="Tên cửa hàng..."
              />
            </div>

            {/* Loại hình và MST */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-500" />
                  Loại hình kinh doanh
                </label>
                <div className="relative">
                  <select
                    name="LoaiHinhKD"
                    value={formData.LoaiHinhKD}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none appearance-none"
                  >
                    <option value="">-- Chọn --</option>
                    {loaiHinhKDOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  Mã số thuế
                </label>
                <input
                  type="text"
                  name="MaSoThue"
                  value={formData.MaSoThue}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                  placeholder="Nhập mã số thuế..."
                />
              </div>
            </div>

            {/* Địa chỉ */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                Địa chỉ lấy hàng <span className="text-red-500">*</span>
              </label>
              <textarea
                name="DCLayHang"
                value={formData.DCLayHang}
                onChange={handleChange}
                required
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none resize-none"
                placeholder="Số nhà, Tên đường, Phường/Xã..."
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-4 mt-10 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors duration-200"
          >
            <X className="w-4 h-4" />
            Hủy bỏ
          </button>

          <button
            type="submit"
            disabled={loading}
            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-white shadow-lg shadow-blue-500/30 transform active:scale-95 transition-all duration-200 ${
              loading
                ? "bg-gray-400 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu thay đổi</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CuahangEditForm;
