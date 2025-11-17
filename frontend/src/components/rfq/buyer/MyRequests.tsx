// ============================================
// 2. BUYER - XEM DANH SÁCH YÊU CẦU
// src/pages/buyer/MyRequests.tsx
// ============================================
import { useBuyerRequests } from "../../../hooks/useRFQ";

export const MyRequestsPage = () => {
  const { requests, loading, error, refetch } = useBuyerRequests(true);

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Yêu Cầu Của Tôi</h1>
        <button
          onClick={refetch}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Làm mới
        </button>
      </div>

      <div className="grid gap-4">
        {requests.map((request) => (
          <div key={request.MaYCDH} className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold">{request.TenSP_YeuCau}</h3>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  request.TrangThai === "Open"
                    ? "bg-green-100 text-green-800"
                    : request.TrangThai === "Completed"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {request.TrangThai}
              </span>
            </div>

            <div className="text-gray-600 space-y-1">
              <p>Số lượng: {request.SoLuongYeuCau} kg</p>
              <p>Giá mong muốn: {request.GiaMongMuon?.toLocaleString()}đ</p>
              <p>Thời hạn: {new Date(request.ThoiHan).toLocaleDateString()}</p>
            </div>

            <a
              href={`/buyer/requests/${request.MaYCDH}/proposals`}
              className="mt-3 inline-block text-green-600 hover:underline"
            >
              Xem đề nghị →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
