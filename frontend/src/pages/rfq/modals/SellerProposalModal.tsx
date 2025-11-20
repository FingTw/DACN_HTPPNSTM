// src/components/rfq/modals/SellerProposalModal.tsx
import { useState, useEffect } from "react";
import { useSellerProducts, useSubmitProposal } from "@/hooks/useRFQ";
import { X, Send, Package, DollarSign, Calendar } from "lucide-react";
import { toast } from "sonner";
import type { BuyerRequest } from "@/services/rfqService";

interface SellerProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: BuyerRequest | null; // Nhận dữ liệu request từ component cha
  onSuccess?: () => void;
}

const formatDateVN = (date: string | undefined) => {
  if (!date) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
};

export default function SellerProposalModal({
  isOpen,
  onClose,
  request,
  onSuccess,
}: SellerProposalModalProps) {
  const { submitProposal, loading: submitting } = useSubmitProposal();

  // Load danh sách sản phẩm của shop để chọn
  const { products, loading: loadingProducts } = useSellerProducts(isOpen, {
    limit: 100,
  });

  const [selectedProduct, setSelectedProduct] = useState("");
  const [form, setForm] = useState({
    SoLuongCungCap: 1,
    GiaDeNghi: 0,
    ChatLuongDeNghi: "",
  });

  // Reset form mỗi khi mở modal hoặc đổi request
  useEffect(() => {
    if (isOpen && request) {
      setForm({
        SoLuongCungCap: request.SoLuongYeuCau || 1, // Mặc định lấy số lượng họ cần
        GiaDeNghi: request.GiaMongMuon || 0, // Mặc định lấy giá họ muốn
        ChatLuongDeNghi: "",
      });
      setSelectedProduct("");
    }
  }, [isOpen, request]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;

    if (!selectedProduct) {
      toast.error("Vui lòng chọn sản phẩm để cung cấp");
      return;
    }

    if (form.SoLuongCungCap <= 0 || form.GiaDeNghi <= 0) {
      toast.error("Số lượng và giá phải lớn hơn 0");
      return;
    }

    try {
      await submitProposal({
        MaYCDH: request.MaYCDH,
        MaSP: selectedProduct,
        SoLuongCungCap: form.SoLuongCungCap,
        GiaDeNghi: form.GiaDeNghi,
        ChatLuongDeNghi: form.ChatLuongDeNghi || undefined,
      });

      toast.success("Gửi đề nghị thành công!");
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Gửi thất bại");
    }
  };

  const selectedProd = products.find((p) => p.MaSP === selectedProduct);

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="flex justify-between items-start p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gửi Báo Giá</h2>
            <p className="text-gray-500 text-sm mt-1">
              Cho yêu cầu:{" "}
              <span className="font-medium text-blue-600">
                #{request.MaYCDH}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Cột Trái: Thông tin Yêu cầu (Read-only) */}
          <div className="lg:col-span-2 space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-100 h-fit">
            <h3 className="font-semibold text-gray-800 border-b pb-2 mb-3">
              Chi tiết yêu cầu
            </h3>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                Sản phẩm cần mua
              </p>
              <p className="font-bold text-gray-900 text-lg leading-snug mt-1">
                {request.TenSP_YeuCau}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold flex items-center gap-1">
                  <Package className="w-3 h-3" /> Số lượng
                </p>
                <p className="font-medium">{request.SoLuongYeuCau}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Giá trần
                </p>
                <p className="font-medium text-green-600">
                  {request.GiaMongMuon > 0
                    ? request.GiaMongMuon.toLocaleString()
                    : "Thỏa thuận"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Hạn chót
              </p>
              <p className="font-medium text-orange-600">
                {formatDateVN(request.ThoiHan)}
              </p>
            </div>

            {request.ChatLuongYeuCau && (
              <div className="pt-2 border-t border-gray-200 mt-2">
                <p className="text-xs text-gray-500 italic">
                  Note: "{request.ChatLuongYeuCau}"
                </p>
              </div>
            )}
          </div>

          {/* Cột Phải: Form Báo Giá */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
            {/* Chọn sản phẩm */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn sản phẩm từ kho của bạn{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                disabled={loadingProducts}
              >
                <option value="">
                  {loadingProducts
                    ? "Đang tải sản phẩm..."
                    : "-- Chọn sản phẩm --"}
                </option>
                {products.map((p) => (
                  <option key={p.MaSP} value={p.MaSP}>
                    {p.TenSP} (Tồn: {p.SLTon}) - {p.GiaBan?.toLocaleString()}₫
                  </option>
                ))}
              </select>
              {products.length === 0 && !loadingProducts && (
                <p className="text-xs text-red-500 mt-1">
                  Shop bạn chưa có sản phẩm nào.
                </p>
              )}
            </div>

            {/* Info sản phẩm đã chọn */}
            {selectedProd && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm flex justify-between items-center">
                <span className="text-blue-800 font-medium">
                  {selectedProd.TenSP}
                </span>
                <span className="text-blue-600 bg-white px-2 py-1 rounded border border-blue-200 text-xs">
                  Tồn kho: {selectedProd.SLTon}
                </span>
              </div>
            )}

            {/* Input Số lượng & Giá */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số lượng cung cấp
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedProd?.SLTon}
                  value={form.SoLuongCungCap}
                  onChange={(e) =>
                    setForm({ ...form, SoLuongCungCap: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá đề nghị (VNĐ)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.GiaDeNghi}
                  onChange={(e) =>
                    setForm({ ...form, GiaDeNghi: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Ghi chú */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú / Cam kết chất lượng
              </label>
              <textarea
                rows={3}
                value={form.ChatLuongDeNghi}
                onChange={(e) =>
                  setForm({ ...form, ChatLuongDeNghi: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="VD: Bao đổi trả, hàng mới thu hoạch..."
              />
            </div>

            {/* Footer Action */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedProduct}
                className="flex-[2] bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed font-bold shadow-lg shadow-green-200 transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" /> Gửi Báo Giá
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
