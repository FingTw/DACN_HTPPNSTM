// src/components/rfq/ProposalCard.tsx
import type { Proposal } from "@/services/rfqService";
import { CheckCircle, Clock } from "lucide-react";

const formatDateVN = (date: string) =>
  new Intl.DateTimeFormat("vi-VN").format(new Date(date));

interface ProposalCardProps {
  proposal: Proposal;
  onAccept: () => void;
  onReject: () => void;
  accepting?: boolean;
  rejecting?: boolean;
}

export default function ProposalCard({
  proposal,
  onAccept,
  onReject,
  accepting,
  rejecting,
}: ProposalCardProps) {
  const seller = proposal.MaTK_Seller_taikhoan;
  const product = proposal.MaSP_sanpham;

  return (
    <div className="bg-white rounded-xl shadow-xl  p-6 hover:shadow-md transition hover:scale-105 duration-300">
      <div className="flex justify-between items-start gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold">{product?.TenSP}</h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                proposal.TrangThai === "Pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : proposal.TrangThai === "Accepted"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {proposal.TrangThai === "Pending" && (
                <>
                  <Clock className="w-3 h-3" /> Đang chờ
                </>
              )}
              {proposal.TrangThai === "Accepted" && (
                <>
                  <CheckCircle className="w-3 h-3" /> Đã chấp nhận
                </>
              )}
              {proposal.TrangThai === "Rejected" && "Bị từ chối"}
            </span>
          </div>

          <p className="text-gray-600 mt-2">
            Từ: <strong>{seller?.HoTen}</strong> -{" "}
            {seller?.cuahangs?.[0]?.TenCH}
          </p>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Số lượng:</span>
              <p className="font-bold text-lg">{proposal.SoLuongCungCap}</p>
            </div>
            <div>
              <span className="text-gray-500">Giá đề nghị:</span>
              <p className="font-bold text-lg text-green-600">
                {proposal.GiaDeNghi.toLocaleString()} ₫
              </p>
            </div>
            <div>
              <span className="text-gray-500">Ngày gửi:</span>
              <p className="font-medium">{formatDateVN(proposal.NgayDeNghi)}</p>
            </div>
            <div>
              <span className="text-gray-500">Chất lượng:</span>
              <p className="italic">
                {proposal.ChatLuongDeNghi || "Không ghi chú"}
              </p>
            </div>
          </div>
        </div>

        {proposal.TrangThai === "Pending" && (
          <div className="flex flex-col gap-3">
            <button
              onClick={onAccept}
              disabled={accepting}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-70 transition font-medium"
            >
              {accepting ? "Đang xử lý..." : "Chấp nhận"}
            </button>
            <button
              onClick={onReject}
              disabled={rejecting}
              className="px-6 py-3 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-70 transition font-medium"
            >
              {rejecting ? "Đang xử lý..." : "Từ chối"}
            </button>
          </div>
        )}

        {proposal.TrangThai === "Accepted" && (
          <div className="text-green-600 font-bold text-2xl">
            ✓ Đã chấp nhận
          </div>
        )}
      </div>
    </div>
  );
}
