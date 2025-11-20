// src/pages/rfq/seller/SellerOpenRequests.tsx
import { useState } from "react";
import { Link } from "react-router-dom"; // Sử dụng Link để điều hướng
import { useSellerRequests } from "@/hooks/useRFQ";
import {
  Package,
  Search,
  Filter,
  Clock,
  DollarSign,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";

export default function SellerOpenRequests() {
  const [filters, setFilters] = useState({ keyword: "", page: 1, limit: 12 });
  const { requests, loading, pagination } = useSellerRequests(true, filters);

  // Format tiền tệ
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  // Tính số ngày còn lại
  const getDaysLeft = (dateString: string) => {
    const deadline = new Date(dateString);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} ngày` : "Hết hạn hôm nay";
  };

  return (
    <div className="space-y-6">
      {/* Header & Search Section - Giống trang tìm kiếm sản phẩm */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="text-green-600" />
              Sàn Yêu Cầu Mua Hàng
            </h1>
            <p className="text-gray-500 mt-1">
              Tìm kiếm cơ hội bán hàng và gửi báo giá ngay
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition">
            <Filter className="w-4 h-4" /> Bộ lọc nâng cao
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên sản phẩm (VD: Gạo, Cà phê...)"
            value={filters.keyword}
            onChange={(e) =>
              setFilters({ ...filters, keyword: e.target.value, page: 1 })
            }
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
          />
        </div>
      </div>

      {/* Grid Danh sách Yêu cầu */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-100 animate-pulse rounded-xl h-64"
            />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            Không tìm thấy yêu cầu nào
          </h3>
          <p className="text-gray-500">Hãy thử tìm từ khóa khác xem sao.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {requests.map((req) => (
            <div
              key={req.MaYCDH}
              className="group bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-green-500 transition-all duration-300 flex flex-col"
            >
              {/* Header Card */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wide">
                    Cần mua
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                    <Clock className="w-3 h-3" />
                    Còn {getDaysLeft(req.ThoiHan)}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-green-700 transition">
                  {req.TenSP_YeuCau}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Mã: #{req.MaYCDH.substring(0, 8)}
                </p>
              </div>

              {/* Body Card - Thông số quan trọng */}
              <div className="p-5 flex-1 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Số lượng cần:</span>
                  <span className="font-bold text-gray-900 text-lg">
                    {req.SoLuongYeuCau}{" "}
                    <span className="text-sm font-normal text-gray-500">
                      đơn vị
                    </span>
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Giá mục tiêu:</span>
                  <span className="font-bold text-green-600 text-lg flex items-center gap-1">
                    {req.GiaMongMuon > 0
                      ? formatCurrency(req.GiaMongMuon)
                      : "Thỏa thuận"}
                  </span>
                </div>

                {/* Progress Bar giả lập độ cạnh tranh (Optional) */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">
                      Đã có 3 nhà cung cấp quan tâm
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-yellow-400 h-1.5 rounded-full w-1/3"></div>
                  </div>
                </div>
              </div>

              {/* Footer Card - Button Hành động */}
              <div className="p-4 bg-gray-50 rounded-b-xl border-t border-gray-100">
                <Link
                  to={`/rfq/seller/requests/${req.MaYCDH}`}
                  className="w-full flex items-center justify-center gap-2 bg-white border-2 border-green-600 text-green-700 hover:bg-green-600 hover:text-white py-2.5 rounded-lg font-bold transition-all duration-200"
                >
                  <DollarSign className="w-4 h-4" />
                  Gửi Báo Giá Ngay
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination (Giữ nguyên logic cũ) */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-6">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            (page) => (
              <button
                key={page}
                onClick={() => setFilters({ ...filters, page })}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  page === filters.page
                    ? "bg-green-600 text-white shadow-lg shadow-green-200"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {page}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
