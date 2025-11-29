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
const defaultBanner = "/banner1.jpg";

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
      {/* Container chính: Cần có relative và overflow-hidden để bo góc ảnh */}
      <div className="relative w-full h-48 overflow-hidden rounded-xl shadow-lg group">
        {/* 1. ẢNH NỀN (Nằm dưới cùng) */}
        <img
          // src={defaultBanner}
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* 2. LỚP PHỦ MỜ (Overlay - Giúp nội dung dễ đọc hơn trên nền ảnh) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

        {/* 3. NỘI DUNG CHÍNH (Nổi lên trên) */}
        <div className="relative z-10 p-4 w-full h-full flex flex-col justify-between">
          {/* Header: Trạng thái & Ngày (Code cũ của bạn đặt vào đây) */}
          <div className="flex justify-between items-start mb-3">
            {/* Badge Trạng Thái */}
            <div
              className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border shadow-sm backdrop-blur-md ${status.bg} ${status.color} ${status.border} flex items-center gap-1`}
            >
              <span className="relative flex h-2 w-2 mr-1">
                {request.TrangThai === "Open" && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    request.TrangThai === "Open"
                      ? "bg-green-500"
                      : "bg-gray-400"
                  }`}
                ></span>
              </span>
              {status.label}
            </div>

            {/* Badge Ngày tháng - Thêm backdrop-blur để đẹp hơn trên nền ảnh */}
            <div className="text-xs text-gray-700 font-medium flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded shadow-sm">
              <Calendar className="w-3 h-3" />
              Hạn:{" "}
              {format(new Date(request.ThoiHan), "dd/MM/yyyy", { locale: vi })}
            </div>
          </div>

          {/* Bạn có thể thêm các nội dung khác ở dưới đây nếu muốn */}
          {/* <h3 className="text-white font-bold text-lg mt-auto">{request.TieuDe}</h3> */}
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
            <span className="text-xs font-normal text-gray-500">kg</span>
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
