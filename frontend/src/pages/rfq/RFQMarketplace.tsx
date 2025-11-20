// src/pages/rfq/RFQMarketplace.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSellerRequests } from "@/hooks/useRFQ";
import {
  Search,
  Filter,
  Package,
  Clock,
  DollarSign,
  PlusCircle,
  Eye,
  ArrowRight,
  FileText, // Thêm icon FileText
} from "lucide-react";
import BuyerCreateRequestModal from "./buyer/BuyerCreateRequest";
import SellerProposalModal from "./modals/SellerProposalModal";
import type { BuyerRequest } from "@/services/rfqService";

export default function RFQMarketplace() {
  const { hasRole } = useAuth();
  const isBuyer = hasRole(["Khách Hàng", "Buyer", "Admin"]);
  const isSeller = hasRole(["Seller", "Người Bán", "Cửa Hàng"]);

  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BuyerRequest | null>(
    null
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [filters, setFilters] = useState({ keyword: "", page: 1, limit: 12 });
  const { requests, loading, pagination, refetch } = useSellerRequests(
    true,
    filters
  );

  const handleOpenProposal = (req: BuyerRequest) => {
    setSelectedRequest(req);
    setIsProposalModalOpen(true);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const getDaysLeft = (dateString: string) => {
    const diff = new Date(dateString).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} ngày` : "Hết hạn";
  };

  return (
    <div className="space-y-6">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-white p-6 rounded-xl shadow-xl ">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sàn Yêu Cầu Mua Hàng
          </h1>
          <p className="text-gray-500 mt-1">
            Nơi kết nối nhu cầu mua và bán nông sản
          </p>
        </div>

        {isBuyer && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-green-500 text-white px-5 py-3 rounded-2xl font-bold hover:bg-green-400 transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-5 h-5" />
            Đăng Yêu Cầu Mới
          </button>
        )}
      </div>

      {/* --- THANH TÌM KIẾM --- */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm (Gạo, Cà phê, Hạt điều...)"
            value={filters.keyword}
            onChange={(e) =>
              setFilters({ ...filters, keyword: e.target.value, page: 1 })
            }
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <button className="px-5 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 flex items-center gap-2 hover:bg-gray-50">
          <Filter className="w-4 h-4" /> Bộ lọc
        </button>
      </div>

      {/* --- GRID DANH SÁCH --- */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 animate-pulse h-80 rounded-xl"
            />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Chưa có yêu cầu nào được tạo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {requests.map((req) => (
            <div
              key={req.MaYCDH}
              className={`group bg-white rounded-xl hover:shadow-md shadow-xl transition-all hover:scale-105 duration-300 flex flex-col h-full ${
                isSeller ? "hover:border-green-500" : "hover:border-blue-500"
              }`}
            >
              {/* HEADER CARD */}
              <div className="p-5 bg-gray-100 shadow-sm rounded-b-xl">
                <div className="flex justify-between items-start">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wide">
                    Cần mua
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                    <Clock className="w-3 h-3" />
                    Còn {getDaysLeft(req.ThoiHan)}
                  </span>
                </div>
                <h3
                  className={`mt-3 text-lg font-bold text-gray-900 line-clamp-2 min-h-[3.5rem] transition ${
                    isSeller
                      ? "group-hover:text-green-700"
                      : "group-hover:text-blue-700"
                  }`}
                >
                  {req.TenSP_YeuCau}
                </h3>
              </div>

              {/* BODY CARD */}
              <div className="p-5 flex-1 flex flex-col gap-4">
                {/* Thông số chính */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Số lượng:</span>
                    <span className="font-bold text-gray-900 text-lg">
                      {req.SoLuongYeuCau}{" "}
                      <span className="text-m font-bold text-gray-500">kg</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Giá trần:</span>
                    <span className="font-bold text-green-600 text-lg flex items-center gap-1">
                      {req.GiaMongMuon > 0
                        ? formatCurrency(req.GiaMongMuon)
                        : "Thỏa thuận"}
                    </span>
                  </div>
                </div>

                {/* 🟢 [MỚI] HIỂN THỊ YÊU CẦU CHẤT LƯỢNG */}
                {req.ChatLuongYeuCau ? (
                  <div className="mt-auto pt-3">
                    <div className="flex items-center gap-2 mb-1 text-gray-800 text-xs font-bold uppercase tracking-wide">
                      <FileText className="w-3 h-3 text-gray-400" />
                      Yêu cầu chất lượng:
                    </div>
                    <p className="text-sm text-gray-600 italic line-clamp-2 bg-gray-50 p-2 rounded-md border border-gray-100">
                      "{req.ChatLuongYeuCau}"
                    </p>
                  </div>
                ) : (
                  // Nếu không có mô tả thì hiện khoảng trống để thẻ đều nhau
                  <div className="mt-auto pt-3 border-t border-gray-100 opacity-0">
                    <p className="text-sm p-2">No content</p>
                  </div>
                )}
              </div>

              {/* FOOTER CARD */}
              <div className="p-4 bg-gray-50 rounded-b-xl ">
                {isSeller ? (
                  <button
                    onClick={() => handleOpenProposal(req)}
                    className="w-full flex items-center justify-center gap-2 border-2 border-green-600 text-green-700 bg-white hover:bg-green-600 hover:text-white py-2.5 rounded-lg font-bold transition-all duration-200"
                  >
                    <DollarSign className="w-4 h-4" />
                    Gửi Báo Giá Ngay
                  </button>
                ) : (
                  <Link
                    to={`/rfq/buyer/requests/${req.MaYCDH}`}
                    className="w-full flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-700 bg-white hover:bg-blue-600 hover:text-white py-2.5 rounded-lg font-bold transition-all duration-200"
                  >
                    <Eye className="w-4 h-4" />
                    Xem Chi Tiết <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-6">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            (page) => (
              <button
                key={page}
                onClick={() => setFilters({ ...filters, page })}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  page === filters.page
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50 border"
                }`}
              >
                {page}
              </button>
            )
          )}
        </div>
      )}

      {/* MODALS */}
      <BuyerCreateRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refetch()}
      />

      <SellerProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        request={selectedRequest}
        onSuccess={() => {
          // refetch();
        }}
      />
    </div>
  );
}
