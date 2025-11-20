// src/components/rfq/RequestCard.tsx
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Package,
  Calendar,
  TrendingUp,
  AlertCircle,
  Users,
  DollarSign,
} from "lucide-react";
import type { BuyerRequest } from "@/services/rfqService";

// 1. Cập nhật Interface: Chấp nhận thêm mảng DeNghiCungCaps (để đếm length)
interface RequestCardProps {
  request: BuyerRequest & {
    progress?: { fulfilled: number; requested: number };
    proposalCount?: number; // Trường hợp Backend đếm sẵn
    DeNghiCungCaps?: any[]; // Trường hợp Backend trả về mảng (Proposal list)
  };
  link: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  Open: {
    label: "Đang mở",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  PartiallyFilled: {
    label: "Đang xử lý",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  Completed: {
    label: "Hoàn thành",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  Expired: {
    label: "Hết hạn",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  Cancelled: {
    label: "Đã hủy",
    color: "text-gray-600",
    bg: "bg-gray-100",
    border: "border-gray-200",
  },
};

export default function RequestCard({ request, link }: RequestCardProps) {
  const status = statusConfig[request.TrangThai] || statusConfig.Open;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);

  const progressPercent = request.progress
    ? Math.round(
        (request.progress.fulfilled / request.progress.requested) * 100
      )
    : 0;

  // 2. LOGIC TÍNH SỐ LƯỢNG BÁO GIÁ (NCC)
  // Ưu tiên 1: Nếu có số đếm sẵn (proposalCount)
  // Ưu tiên 2: Nếu có mảng danh sách (DeNghiCungCaps), đếm length của mảng đó
  // Mặc định: 0
  const proposalCount =
    request.proposalCount || request.DeNghiCungCaps?.length || 0;

  return (
    <Link
      to={link}
      className="group relative block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-blue-400 transition-all duration-300 flex flex-col h-full"
    >
      {/* Header: Trạng thái & Ngày */}
      <div className="flex justify-between items-start mb-3">
        <div
          className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${status.bg} ${status.color} ${status.border} flex items-center gap-1`}
        >
          <span className="relative flex h-2 w-2 mr-1">
            {request.TrangThai === "Open" && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                request.TrangThai === "Open" ? "bg-green-500" : "bg-gray-400"
              }`}
            ></span>
          </span>
          {status.label}
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
          <Calendar className="w-3 h-3" />
          Hạn: {format(new Date(request.ThoiHan), "dd/MM/yyyy", { locale: vi })}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-bold text-lg text-gray-900 mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors min-h-[3.5rem]">
        {request.TenSP_YeuCau}
      </h3>

      {/* Grid thông tin chính */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <Package className="w-3.5 h-3.5" />
            <span>Số lượng</span>
          </div>
          <p className="font-bold text-gray-900">
            {request.SoLuongYeuCau}{" "}
            <span className="text-xs font-normal text-gray-500">đơn vị</span>
          </p>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
          <div className="flex items-center gap-1.5 text-xs text-blue-600 mb-1">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Giá mục tiêu</span>
          </div>
          <p className="font-bold text-blue-700">
            {request.GiaMongMuon > 0
              ? formatCurrency(request.GiaMongMuon)
              : "Thỏa thuận"}
          </p>
        </div>
      </div>

      {/* Footer: Metrics & Progress */}
      <div className="mt-auto pt-4 border-t border-gray-100 space-y-3">
        {/* 3. HIỂN THỊ SỐ LƯỢNG BÁO GIÁ */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="w-4 h-4 text-gray-400" />
            <span>Đã nhận báo giá:</span>
          </div>
          <span
            className={`font-bold ${
              proposalCount > 0 ? "text-gray-900" : "text-gray-400 italic"
            }`}
          >
            {proposalCount > 0 ? `${proposalCount} NCC` : "Chưa có"}
          </span>
        </div>

        {/* Thanh tiến độ (Nếu có progress) */}
        {request.progress && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Tiến độ nhập hàng
              </span>
              <span className="font-medium text-gray-700">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progressPercent >= 100 ? "bg-green-500" : "bg-blue-500"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[10px] text-gray-400 mt-1 text-right">
              Đã nhập: {request.progress.fulfilled} /{" "}
              {request.progress.requested}
            </div>
          </div>
        )}

        {/* Nếu không có progress thì hiện text nhắc nhở */}
        {!request.progress && request.TrangThai === "Open" && (
          <div className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 p-2 rounded">
            <AlertCircle className="w-3 h-3" />
            {proposalCount > 0
              ? "Đang chờ bạn xem xét báo giá"
              : "Đang chờ nhà cung cấp phản hồi"}
          </div>
        )}
      </div>
    </Link>
  );
}
