// src/pages/rfq/modals/BuyerCreateRequestModal.tsx
import { useState, useEffect } from "react";
import { useCreateRequest } from "@/hooks/useRFQ";
import { categoryService } from "@/services/categoryService";

import { toast } from "sonner";
import { X, Save, Package, DollarSign, Calendar, FileText } from "lucide-react";

interface BuyerCreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BuyerCreateRequestModal({
  isOpen,
  onClose,
  onSuccess,
}: BuyerCreateRequestModalProps) {
  const { createRequest, loading } = useCreateRequest();
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    MaDM: "",
    TenSP_YeuCau: "",
    SoLuongYeuCau: 1,
    ChatLuongYeuCau: "",
    GiaMongMuon: 0,
    ThoiHan: "",
  });

  useEffect(() => {
    if (isOpen) {
      // Reset form + set ngày mặc định
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 3);
      setFormData({
        MaDM: "",
        TenSP_YeuCau: "",
        SoLuongYeuCau: 1,
        ChatLuongYeuCau: "",
        GiaMongMuon: 0,
        ThoiHan: defaultDate.toISOString().split("T")[0],
      });

      // Fetch categories
      categoryService
        .getAllCategories()
        .then((data) => setCategories(data || []))
        .catch((err) => {
          console.error(err);
          toast.error("Không tải được danh mục");
        });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.TenSP_YeuCau || formData.SoLuongYeuCau <= 0) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    try {
      await createRequest({
        MaDM: formData.MaDM || undefined,
        TenSP_YeuCau: formData.TenSP_YeuCau,
        SoLuongYeuCau: formData.SoLuongYeuCau,
        ChatLuongYeuCau: formData.ChatLuongYeuCau || undefined,
        GiaMongMuon:
          formData.GiaMongMuon > 0 ? formData.GiaMongMuon : undefined,
        ThoiHan: formData.ThoiHan || undefined,
      });

      toast.success("Tạo yêu cầu mua hàng thành công!");
      onClose();
      if (onSuccess) onSuccess();

      // Reset form
      setFormData({
        MaDM: "",
        TenSP_YeuCau: "",
        SoLuongYeuCau: 1,
        ChatLuongYeuCau: "",
        GiaMongMuon: 0,
        ThoiHan: "",
      });
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi tạo yêu cầu");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/20 p-4">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              Tạo Yêu cầu Mua hàng
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 transition-all p-2 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-6 overflow-y-auto max-h-[calc(95vh-88px)]"
        >
          {/* Danh mục */}
          <div className="group">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <Package className="w-4 h-4 text-green-600" />
              Danh mục
              <span className="text-xs font-normal text-gray-500">
                (không bắt buộc)
              </span>
            </label>
            <select
              value={formData.MaDM}
              onChange={(e) =>
                setFormData({ ...formData, MaDM: e.target.value })
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all outline-none bg-white hover:border-gray-300 cursor-pointer"
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((cat) => (
                <option key={cat.MaDM} value={cat.MaDM}>
                  {cat.TenDM}
                </option>
              ))}
            </select>
          </div>

          {/* Tên sản phẩm */}
          <div className="group">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <FileText className="w-4 h-4 text-green-600" />
              Tên sản phẩm
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.TenSP_YeuCau}
              onChange={(e) =>
                setFormData({ ...formData, TenSP_YeuCau: e.target.value })
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all outline-none placeholder:text-gray-400 hover:border-gray-300"
              placeholder="VD: Gạo thơm ST25..."
            />
          </div>

          {/* Số lượng và Giá */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <Package className="w-4 h-4 text-green-600" />
                Số lượng
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.SoLuongYeuCau}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    SoLuongYeuCau: Number(e.target.value),
                  })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all outline-none hover:border-gray-300"
              />
            </div>

            <div className="group">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <DollarSign className="w-4 h-4 text-green-600" />
                Giá mong muốn
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={formData.GiaMongMuon}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      GiaMongMuon: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 pr-16 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all outline-none hover:border-gray-300"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                  VND
                </span>
              </div>
            </div>
          </div>

          {/* Yêu cầu chất lượng */}
          <div className="group">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <FileText className="w-4 h-4 text-green-600" />
              Yêu cầu chất lượng
            </label>
            <textarea
              rows={4}
              value={formData.ChatLuongYeuCau}
              onChange={(e) =>
                setFormData({ ...formData, ChatLuongYeuCau: e.target.value })
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all outline-none placeholder:text-gray-400 resize-none hover:border-gray-300"
              placeholder="VD: Hàng mới 100%..."
            />
          </div>

          {/* Thời hạn */}
          <div className="group">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <Calendar className="w-4 h-4 text-green-600" />
              Thời hạn
              <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.ThoiHan}
              onChange={(e) =>
                setFormData({ ...formData, ThoiHan: e.target.value })
              }
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all outline-none hover:border-gray-300 cursor-pointer"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all active:scale-95"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 active:scale-95 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? "Đang tạo..." : "Tạo yêu cầu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
