// ============================================
// 3. BUYER - XEM ĐỀ NGHỊ CHO YÊU CẦU
// src/pages/buyer/ViewProposals.tsx
// ============================================
import { useParams } from "react-router-dom";
import {
  useProposalsForRequest,
  useAcceptProposal,
  useRejectProposal,
} from "../../../hooks/useRFQ";
import type { Proposal } from "../../../services/rfqService";

export const ViewProposalsPage = () => {
  const { MaYCDH } = useParams<{ MaYCDH: string }>();
  const { data, loading, error, refetch } = useProposalsForRequest(MaYCDH!);
  const { acceptProposal, loading: accepting } = useAcceptProposal();
  const { rejectProposal, loading: rejecting } = useRejectProposal();

  const handleAccept = async (MaDNCC: string) => {
    if (!confirm("Bạn có chắc muốn chấp nhận đề nghị này?")) return;
    try {
      await acceptProposal({ MaDNCC });
      alert("Chấp nhận thành công!");
      refetch();
    } catch (err) {
      alert("Lỗi chấp nhận đề nghị");
    }
  };

  const handleReject = async (MaDNCC: string) => {
    const reason = prompt("Lý do từ chối:");
    if (!reason) return;
    try {
      await rejectProposal(MaDNCC, reason);
      alert("Đã từ chối");
      refetch();
    } catch (err) {
      alert("Lỗi từ chối");
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">
        Đề Nghị Cho: {data?.request.TenSP_YeuCau}
      </h1>

      <div className="bg-blue-50 p-4 rounded mb-6">
        <div className="flex justify-between text-sm">
          <span>Cần: {data?.summary.progress.requested} kg</span>
          <span>Đã có: {data?.summary.progress.fulfilled} kg</span>
          <span className="font-semibold text-green-600">
            Còn thiếu: {data?.summary.progress.remaining} kg
          </span>
        </div>
        <div className="mt-2 bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full"
            style={{
              width: `${
                (data?.summary.progress.fulfilled /
                  data?.summary.progress.requested) *
                100
              }%`,
            }}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {data?.proposals
          .sort((a: Proposal, b: Proposal) => a.GiaDeNghi - b.GiaDeNghi) // <--- Đã sửa lỗi a, b
          .map((proposal: Proposal) => (
            <div
              key={proposal.MaDNCC}
              className="border rounded-lg p-4 bg-white"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {proposal.MaTK_Seller_taikhoan?.HoTen}
                  </h3>
                  <p className="text-gray-600">
                    {proposal.MaTK_Seller_taikhoan?.cuahangs?.[0]?.TenCH}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    proposal.TrangThai === "Pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : proposal.TrangThai === "Accepted"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {proposal.TrangThai}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Sản phẩm</p>
                  <p className="font-medium">{proposal.MaSP_sanpham?.TenSP}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Số lượng</p>
                  <p className="font-medium">{proposal.SoLuongCungCap} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Giá đề nghị</p>
                  <p className="font-medium text-green-600">
                    {proposal.GiaDeNghi.toLocaleString()}đ/kg
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng tiền</p>
                  <p className="font-medium">
                    {(
                      proposal.GiaDeNghi * proposal.SoLuongCungCap
                    ).toLocaleString()}
                    đ
                  </p>
                </div>
              </div>

              {proposal.ChatLuongDeNghi && (
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-700">
                    {proposal.ChatLuongDeNghi}
                  </p>
                </div>
              )}

              {proposal.TrangThai === "Pending" && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleAccept(proposal.MaDNCC)}
                    disabled={accepting || rejecting}
                    className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                  >
                    Chấp Nhận
                  </button>
                  <button
                    onClick={() => handleReject(proposal.MaDNCC)}
                    disabled={accepting || rejecting}
                    className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
                  >
                    Từ Chối
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};
