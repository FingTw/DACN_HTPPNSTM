// src/pages/rfq/seller/SellerRequestDetail.tsx
import { useParams, useNavigate } from "react-router-dom";
import {
  useSellerProducts,
  useSubmitProposal,
  useSellerRequests,
} from "@/hooks/useRFQ";
import { useState, useEffect } from "react";
import { ArrowLeft, Send, Package, Calendar, DollarSign } from "lucide-react";
import LoadingSpinner from "@/components/rfq/LoadingSpinner";
import { toast } from "sonner";
import type { BuyerRequest } from "@/services/rfqService";

const formatDateVN = (date: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));

export default function SellerRequestDetail() {
  const { MaYCDH } = useParams<{ MaYCDH: string }>();
  const navigate = useNavigate();

  const { submitProposal, loading: submitting } = useSubmitProposal();

  const {
    requests,
    loading: loadingRequests,
    refetch: refetchRequests,
  } = useSellerRequests(false, { limit: 1000 });
  const {
    products,
    loading: loadingProducts,
    refetch: refetchProducts,
  } = useSellerProducts(false, { limit: 100 });

  useEffect(() => {
    refetchRequests();
    refetchProducts();
  }, []);

  const [selectedProduct, setSelectedProduct] = useState("");
  const [form, setForm] = useState({
    SoLuongCungCap: 1,
    GiaDeNghi: 0,
    ChatLuongDeNghi: "",
  });

  // Tìm yêu cầu từ danh sách
  const request = requests.find((r: BuyerRequest) => r.MaYCDH === MaYCDH);

  // Set giá mặc định từ giá mong muốn của yêu cầu
  useEffect(() => {
    if (request && request.GiaMongMuon > 0 && form.GiaDeNghi === 0) {
      setForm((prev) => ({ ...prev, GiaDeNghi: request.GiaMongMuon }));
    }
  }, [request]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      toast.error("Vui lòng chọn sản phẩm");
      return;
    }

    if (form.SoLuongCungCap <= 0 || form.GiaDeNghi <= 0) {
      toast.error("Số lượng và giá phải lớn hơn 0");
      return;
    }

    try {
      await submitProposal({
        MaYCDH: MaYCDH!,
        MaSP: selectedProduct,
        SoLuongCungCap: form.SoLuongCungCap,
        GiaDeNghi: form.GiaDeNghi,
        ChatLuongDeNghi: form.ChatLuongDeNghi || undefined,
      });
      toast.success("Gửi đề nghị thành công!");
      navigate("/rfq/seller/proposals");
    } catch (err: any) {
      toast.error(err.message || "Gửi thất bại");
    }
  };

  const selectedProd = products.find((p) => p.MaSP === selectedProduct);

  if (loadingRequests || loadingProducts) return <LoadingSpinner />;

  if (!request) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pt-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" /> Quay lại
        </button>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <p className="text-lg text-yellow-800">
            Không tìm thấy yêu cầu <strong>{MaYCDH}</strong>
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Có thể yêu cầu đã hết hạn hoặc bị xóa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" /> Quay lại danh sách
      </button>

      {/* Thông tin yêu cầu */}
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {request.TenSP_YeuCau}
            </h1>
            <p className="text-gray-600 mt-2">
              Mã yêu cầu: <strong>{request.MaYCDH}</strong>
            </p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              request.TrangThai === "Open"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {request.TrangThai === "Open" ? "Đang mở" : "Đang xử lý"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Số lượng cần</p>
              <p className="text-xl font-bold">{request.SoLuongYeuCau}</p>
            </div>
          </div>

          {request.GiaMongMuon > 0 && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-green-600">
                  {(request.GiaMongMuon ?? 0).toLocaleString("vi-VN")} ₫
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Hạn chót</p>
              <p className="text-xl font-bold">
                {formatDateVN(request.ThoiHan)}
              </p>
            </div>
          </div>
        </div>

        {request.ChatLuongYeuCau && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-1">
              Yêu cầu về chất lượng:
            </p>
            <p className="text-gray-600">{request.ChatLuongYeuCau}</p>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border p-8 space-y-6"
      >
        <h2 className="text-xl font-semibold">Chọn sản phẩm của bạn</h2>

        <select
          required
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg text-lg"
        >
          <option value="">-- Chọn sản phẩm để cung cấp --</option>
          {products.map((p) => (
            <option key={p.MaSP} value={p.MaSP}>
              {p.TenSP} - Tồn kho: {p.SLTon ?? 0} - Giá:{" "}
              {(p.GiaBan ?? 0).toLocaleString("vi-VN")} ₫
            </option>
          ))}
        </select>

        {selectedProd && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-medium">{selectedProd.TenSP}</p>
            <p className="text-sm text-gray-600">
              Tồn kho: {selectedProd?.SLTon ?? 0} • Đơn vị:{" "}
              {selectedProd?.DonViTinh || "N/A"}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Số lượng cung cấp *
            </label>
            <input
              required
              type="number"
              min="1"
              max={selectedProd?.SLTon}
              value={form.SoLuongCungCap}
              onChange={(e) =>
                setForm({ ...form, SoLuongCungCap: Number(e.target.value) })
              }
              className="w-full px-4 py-3 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Giá đề nghị (VND) *
            </label>
            <input
              required
              type="number"
              min="1"
              value={form.GiaDeNghi}
              onChange={(e) =>
                setForm({ ...form, GiaDeNghi: Number(e.target.value) })
              }
              className="w-full px-4 py-3 border rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Mô tả chất lượng (không bắt buộc)
          </label>
          <textarea
            rows={4}
            value={form.ChatLuongDeNghi}
            onChange={(e) =>
              setForm({ ...form, ChatLuongDeNghi: e.target.value })
            }
            className="w-full px-4 py-3 border rounded-lg"
            placeholder="VD: Hàng mới 100%, có giấy chứng nhận, giao hàng nhanh..."
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !selectedProduct || loadingProducts}
          className="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 disabled:opacity-70 transition flex items-center justify-center gap-3 text-lg font-medium"
        >
          <Send className="w-5 h-5" />
          {submitting ? "Đang gửi đề nghị..." : "Gửi đề nghị cung cấp"}
        </button>
      </form>
    </div>
  );
}
