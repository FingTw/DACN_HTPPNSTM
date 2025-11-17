// ============================================
// 5. SELLER - GỬI ĐỀ NGHỊ
// src/pages/seller/SubmitProposal.tsx
// ============================================
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSellerProducts, useSubmitProposal } from "../../../hooks/useRFQ";

export const SubmitProposalPage = () => {
  const { MaYCDH } = useParams<{ MaYCDH: string }>();
  const navigate = useNavigate();
  const { products, loading: loadingProducts } = useSellerProducts(true);
  const { submitProposal, loading, error } = useSubmitProposal();

  const [formData, setFormData] = useState({
    MaSP: "",
    SoLuongCungCap: 0,
    GiaDeNghi: 0,
    ChatLuongDeNghi: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitProposal({
        MaYCDH: MaYCDH!,
        ...formData,
      });
      alert("Gửi đề nghị thành công!");
      navigate("/seller/proposals");
    } catch (err) {
      console.error(err);
    }
  };

  if (loadingProducts) return <div>Đang tải sản phẩm...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gửi Đề Nghị Cung Cấp</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-2">Chọn sản phẩm *</label>
          <select
            value={formData.MaSP}
            onChange={(e) => setFormData({ ...formData, MaSP: e.target.value })}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="">-- Chọn sản phẩm --</option>
            {products.map((product) => (
              <option key={product.MaSP} value={product.MaSP}>
                {product.TenSP} - Còn: {product.SoLuongTonKho} kg
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium mb-2">
            Số lượng cung cấp (kg) *
          </label>
          <input
            type="number"
            value={formData.SoLuongCungCap}
            onChange={(e) =>
              setFormData({ ...formData, SoLuongCungCap: +e.target.value })
            }
            className="w-full border rounded px-3 py-2"
            min="1"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-2">
            Giá đề nghị (VNĐ/kg) *
          </label>
          <input
            type="number"
            value={formData.GiaDeNghi}
            onChange={(e) =>
              setFormData({ ...formData, GiaDeNghi: +e.target.value })
            }
            className="w-full border rounded px-3 py-2"
            min="0"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Mô tả chất lượng</label>
          <textarea
            value={formData.ChatLuongDeNghi}
            onChange={(e) =>
              setFormData({ ...formData, ChatLuongDeNghi: e.target.value })
            }
            className="w-full border rounded px-3 py-2"
            rows={3}
            placeholder="VD: VietGAP, thu hoạch sáng nay, tặng kèm rổ..."
          />
        </div>

        {error && <div className="text-red-600">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? "Đang gửi..." : "Gửi Đề Nghị"}
        </button>
      </form>
    </div>
  );
};
