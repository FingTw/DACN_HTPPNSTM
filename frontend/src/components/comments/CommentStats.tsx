// src/components/comments/CommentStats.tsx
import React from "react";
import { MessageSquare, CheckCircle, Star } from "lucide-react";
import type { DanhGiaThongKe } from "@/services/danhGiaSanPhamService";

// 🟢 Component Rating cho stats
const StarRating: React.FC<{ rating: number; size?: "sm" | "md" | "lg" }> = ({
  rating,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, index) => (
        <Star
          key={index}
          className={`${sizeClasses[size]} ${
            index < Math.floor(rating)
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
};

interface CommentStatsProps {
  stats: DanhGiaThongKe;
  averageRating?: number;
  showTitle?: boolean;
  compact?: boolean;
  totalReviews?: number; // 🟢 THÊM PROP NÀY
}

const CommentStats: React.FC<CommentStatsProps> = ({
  stats,
  averageRating,
  showTitle = true,
  compact = false,
  totalReviews, // 🟢 NHẬN PROP MỚI
}) => {
  // 🟢 SỬ DỤNG totalReviews HOẶC stats.tongDanhGia
  const displayTotalReviews = totalReviews ?? stats.tongDanhGia;

  if (compact) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {displayTotalReviews}
            </div>
            <div className="text-xs text-gray-600">Đánh giá</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.daMuaHang || 0}
            </div>
            <div className="text-xs text-gray-600">Đã mua</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {averageRating?.toFixed(1) || "0.0"}
            </div>
            <div className="text-xs text-gray-600">Trung bình</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      {showTitle && (
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Thống kê đánh giá
        </h3>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Tổng đánh giá */}
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">
              {displayTotalReviews}
            </span>
          </div>
          <p className="text-sm text-blue-700">Tổng đánh giá</p>
        </div>

        {/* Đã mua hàng */}
        <div className="text-center p-4 bg-emerald-50 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-2xl font-bold text-emerald-600">
              {stats.daMuaHang}
            </span>
          </div>
          <p className="text-sm text-emerald-700">Đã mua hàng</p>
        </div>

        {/* Điểm trung bình */}
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-5 h-5 text-purple-600" />
            <span className="text-2xl font-bold text-purple-600">
              {averageRating?.toFixed(1) || "0.0"}
            </span>
          </div>
          <p className="text-sm text-purple-700">Điểm trung bình</p>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 mb-4">Phân phối đánh giá</h4>
        {stats.thongKeChiTiet
          ?.sort((a, b) => b.diem - a.diem)
          .map((item) => (
            <div key={item.diem} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-16">
                <StarRating rating={item.diem} size="sm" />
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${item.phanTram}%` }}
                ></div>
              </div>
              <div className="w-12 text-right">
                <span className="text-sm text-gray-600">{item.phanTram}%</span>
              </div>
              <div className="w-8 text-right">
                <span className="text-xs text-gray-500">({item.soLuong})</span>
              </div>
            </div>
          ))}
      </div>

      {/* 🟢 THÊM TỔNG KẾT */}
      {displayTotalReviews > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600 text-center">
            Dựa trên{" "}
            <span className="font-semibold">{displayTotalReviews}</span> đánh
            giá từ khách hàng
            {stats.daMuaHang > 0 && (
              <>
                , trong đó{" "}
                <span className="font-semibold">{stats.daMuaHang}</span> người
                đã mua hàng
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentStats;
