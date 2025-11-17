// ============================================
// 4. SELLER - XEM YÊU CẦU ĐANG MỞ
// src/pages/seller/OpenRequests.tsx
// ============================================
import { useSellerRequests } from "../../../hooks/useRFQ";

export const OpenRequestsPage = () => {
  const { requests, loading, error } = useSellerRequests(true);

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Yêu Cầu Đang Mở</h1>

      <div className="grid gap-4">
        {requests.map((request) => (
          <div key={request.MaYCDH} className="border rounded-lg p-4 bg-white">
            <h3 className="text-lg font-semibold mb-2">
              {request.TenSP_YeuCau}
            </h3>

            <div className="text-gray-600 space-y-1">
              <p>Người mua: {request.MaTK_Buyer}</p>
              <p>Số lượng cần: {request.SoLuongYeuCau} kg</p>
              <p>Giá mong muốn: {request.GiaMongMuon?.toLocaleString()}đ/kg</p>
              <p>Thời hạn: {new Date(request.ThoiHan).toLocaleDateString()}</p>
            </div>

            {request.ChatLuongYeuCau && (
              <div className="mt-2 p-3 bg-blue-50 rounded">
                <p className="text-sm">{request.ChatLuongYeuCau}</p>
              </div>
            )}

            <a
              href={`/seller/submit-proposal/${request.MaYCDH}`}
              className="mt-3 inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Gửi Đề Nghị →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
