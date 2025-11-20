// src/pages/rfq/buyer/BuyerRequestDetail.tsx
import { useParams, useNavigate } from "react-router-dom";
import {
  useProposalsForRequest,
  useAcceptProposal,
  useRejectProposal,
} from "@/hooks/useRFQ";
import ProposalCard from "@/components/rfq/ProposalCard";
import LoadingSpinner from "@/components/rfq/LoadingSpinner";
import {
  ArrowLeft,
  Calendar,
  Package,
  DollarSign,
  Users,
  Clock,
  FileText,
  TrendingUp,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import type { Proposal } from "@/services/rfqService";

const formatDateVN = (date: string | undefined | null) => {
  if (!date) return "Chưa cập nhật";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Ngày không hợp lệ";
  return new Intl.DateTimeFormat("vi-VN").format(d);
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);

// Config màu sắc trạng thái
const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: any }
> = {
  Open: {
    label: "Đang mở nhận báo giá",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: Clock,
  },
  PartiallyFilled: {
    label: "Đang xử lý",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: TrendingUp,
  },
  Completed: {
    label: "Đã hoàn thành",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: CheckCircle,
  },
  Expired: {
    label: "Đã hết hạn",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: AlertCircle,
  },
};

export default function BuyerRequestDetail() {
  const { MaYCDH } = useParams<{ MaYCDH: string }>();
  const navigate = useNavigate();

  const { data, loading, refetch } = useProposalsForRequest(MaYCDH!);
  const { rejectProposal, loading: rejecting } = useRejectProposal();
  const { loading: accepting } = useAcceptProposal();

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );

  const { request, proposals = [], summary } = data || {};

  // Xử lý chấp nhận -> Chuyển sang Checkout
  const handleAccept = (proposal: Proposal) => {
    const checkoutItem = {
      MaSP: proposal.MaSP,
      SL: proposal.SoLuongCungCap,
      TongTien: proposal.SoLuongCungCap * proposal.GiaDeNghi,
      MaSP_sanpham: {
        MaSP: proposal.MaSP,
        TenSP: proposal.MaSP_sanpham?.TenSP || "Sản phẩm RFQ",
        GiaBan: proposal.GiaDeNghi,
        SLTon: proposal.MaSP_sanpham?.SLTon || proposal.SoLuongCungCap,
      },
    };

    navigate("/checkout", {
      state: {
        selectedItems: [checkoutItem],
        isRFQ: true,
        rfqData: {
          MaDNCC: proposal.MaDNCC,
          MaYCDH: proposal.MaYCDH,
          GiaDeNghi: proposal.GiaDeNghi,
        },
      },
    });
  };

  const handleReject = async (MaDNCC: string) => {
    const reason = prompt("Lý do từ chối (không bắt buộc):");
    if (reason === null) return;

    try {
      await rejectProposal(MaDNCC, reason || undefined);
      refetch();
      alert("Đã từ chối đề nghị");
    } catch (err: any) {
      alert(err.message || "Lỗi khi từ chối");
    }
  };

  // Tính toán tiến độ
  const requested = summary?.progress?.requested || 1;
  const fulfilled = summary?.progress?.fulfilled || 0;
  const percent = Math.round((fulfilled / requested) * 100);

  // Config status hiện tại
  const currentStatus =
    statusConfig[request?.TrangThai || "Open"] || statusConfig.Open;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Nút quay lại */}
      <button
        onClick={() => navigate(-1)}
        className="group flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50 w-fit"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Quay lại danh sách</span>
      </button>

      {/* --- CARD THÔNG TIN CHÍNH (HERO SECTION) --- */}
      <div className="bg-white rounded-2xl shadow-lg  overflow-hidden">
        {/* Header Card */}
        <div className="border-b border-gray-100 bg-gray-50/50 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 ${currentStatus.bg} ${currentStatus.color} ${currentStatus.border}`}
                >
                  <StatusIcon className="w-3.5 h-3.5" />
                  {currentStatus.label}
                </span>
                <span className="text-sm text-gray-400 font-medium">
                  #{request?.MaYCDH}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {request?.TenSP_YeuCau}
              </h1>
              <p className="text-gray-500 mt-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Ngày tạo: {formatDateVN(request?.NgayTao)}
              </p>
            </div>

            {/* Box Tiến độ lớn */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm min-w-[250px]">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> Tiến độ nhập hàng
                </span>
                <span className="font-bold text-gray-900">{percent}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    percent >= 100 ? "bg-green-500" : "bg-blue-600"
                  }`}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-right text-gray-500 font-medium">
                Đã nhập: <span className="text-gray-900">{fulfilled}</span> /{" "}
                {requested}
              </div>
            </div>
          </div>
        </div>

        {/* Body Card - Grid Stats */}
        <div className="p-6 md:p-8 rounded-b-2xl bg-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stat 1: Số lượng */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Package className="w-5 h-5" />
                <span className="text-sm font-semibold uppercase">
                  Số lượng cần
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {request?.SoLuongYeuCau}
              </p>
            </div>

            {/* Stat 2: Giá */}
            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm font-semibold uppercase">
                  Giá trần
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {request?.GiaMongMuon > 0
                  ? formatCurrency(request.GiaMongMuon)
                  : "Thỏa thuận"}
              </p>
            </div>

            {/* Stat 3: Hạn chót */}
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
              <div className="flex items-center gap-2 text-orange-600 mb-1">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-semibold uppercase">
                  Hạn chót
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatDateVN(request?.ThoiHan)}
              </p>
            </div>

            {/* Stat 4: Báo giá (NEW) */}
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Users className="w-5 h-5" />
                <span className="text-sm font-semibold uppercase">
                  Báo giá đã nhận
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {proposals.length}{" "}
                <span className="text-sm font-normal text-gray-500">NCC</span>
              </p>
            </div>
          </div>

          {/* Mô tả chất lượng */}
          {request?.ChatLuongYeuCau && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                Yêu cầu chi tiết về chất lượng
              </h3>
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 text-gray-700 italic leading-relaxed">
                "{request.ChatLuongYeuCau}"
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- DANH SÁCH ĐỀ NGHỊ --- */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Danh sách báo giá
            <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-lg rounded-full font-normal">
              {proposals.length}
            </span>
          </h2>

          {/* Bộ lọc nhỏ (Optional) */}
          <select className="px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option>Mới nhất</option>
            <option>Giá thấp nhất</option>
          </select>
        </div>

        {!proposals || proposals.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              Chưa có nhà cung cấp nào báo giá
            </h3>
            <p className="text-gray-500 mt-1 max-w-md mx-auto">
              Yêu cầu của bạn đang được hiển thị trên sàn. Hãy kiên nhẫn chờ đợi
              nhé!
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {proposals.map((prop: Proposal) => (
              <ProposalCard
                key={prop.MaDNCC}
                proposal={prop}
                onAccept={() => handleAccept(prop)}
                onReject={() => handleReject(prop.MaDNCC)}
                accepting={accepting}
                rejecting={rejecting}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
