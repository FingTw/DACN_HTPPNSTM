// ============================================
// 1. BUYER - TẠO YÊU CẦU MUA HÀNG
// src/pages/buyer/CreateRequest.tsx
// ============================================
import React, { useState } from "react";
import { useCreateRequest } from "../../../hooks/useRFQ";
import { useNavigate } from "react-router-dom";

export const CreateRequestPage = () => {
  const { createRequest, loading, error } = useCreateRequest();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    TenSP_YeuCau: "",
    SoLuongYeuCau: 0,
    ChatLuongYeuCau: "",
    GiaMongMuon: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRequest(formData);
      alert("Tạo yêu cầu thành công!");
      navigate("/buyer/requests");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Tạo Yêu Cầu Mua Hàng</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-2">Tên sản phẩm *</label>
          <input
            type="text"
            value={formData.TenSP_YeuCau}
            onChange={(e) =>
              setFormData({ ...formData, TenSP_YeuCau: e.target.value })
            }
            className="w-full border rounded px-3 py-2"
            placeholder="VD: Cà chua bi"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Số lượng (kg) *</label>
          <input
            type="number"
            value={formData.SoLuongYeuCau}
            onChange={(e) =>
              setFormData({ ...formData, SoLuongYeuCau: +e.target.value })
            }
            className="w-full border rounded px-3 py-2"
            min="1"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Yêu cầu chất lượng</label>
          <textarea
            value={formData.ChatLuongYeuCau}
            onChange={(e) =>
              setFormData({ ...formData, ChatLuongYeuCau: e.target.value })
            }
            className="w-full border rounded px-3 py-2"
            rows={3}
            placeholder="VD: Size 2-3cm, độ chín 80%, organic..."
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Giá mong muốn (VNĐ)</label>
          <input
            type="number"
            value={formData.GiaMongMuon}
            onChange={(e) =>
              setFormData({ ...formData, GiaMongMuon: +e.target.value })
            }
            className="w-full border rounded px-3 py-2"
            min="0"
          />
        </div>

        {error && <div className="text-red-600">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? "Đang tạo..." : "Tạo Yêu Cầu"}
        </button>
      </form>
    </div>
  );
};
