// src/pages/rfq/buyer/BuyerDashboard.tsx
import { useState, useMemo } from "react"; // [Sửa 1] Thêm imports
import { Link } from "react-router-dom";
import { Plus, Package, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useBuyerRequests, useBuyerStatistics } from "@/hooks/useRFQ";
import StatsCard from "@/components/rfq/StatsCard";
import RequestCard from "@/components/rfq/RequestCard";
import BuyerCreateRequestModal from "./BuyerCreateRequest";
export default function BuyerDashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const requestFilters = useMemo(() => ({ limit: 6 }), []);

  const {
    requests,
    loading: reqLoading,
    refetch,
  } = useBuyerRequests(true, requestFilters);
  const { stats } = useBuyerStatistics();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Yêu cầu mua hàng</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Tạo yêu cầu mới
        </button>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Tổng yêu cầu"
          value={stats?.totalRequests ?? 0}
          icon={Package}
          color="blue"
        />
        <StatsCard
          title="Đang mở"
          value={stats?.openRequests ?? 0}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="Hoàn thành"
          value={stats?.completedRequests ?? 0}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Đề nghị đang chờ"
          value={stats?.pendingProposals ?? 0}
          icon={AlertCircle}
          color="purple"
        />
      </div>

      {/* Yêu cầu gần đây */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Yêu cầu gần đây</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {reqLoading ? (
            <div className="p-12 text-center text-gray-500">Đang tải...</div>
          ) : requests.length === 0 ? (
            <div className="p-16 text-center">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">Bạn chưa tạo yêu cầu nào</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="text-blue-600 hover:underline font-medium"
              >
                Tạo yêu cầu đầu tiên →
              </button>
            </div>
          ) : (
            requests.map((req) => (
              <RequestCard
                key={req.MaYCDH}
                request={req}
                link={`/rfq/buyer/requests/${req.MaYCDH}`}
              />
            ))
          )}
        </div>
      </div>

      {/* [Sửa 6] Nhúng Modal vào cuối trang */}
      <BuyerCreateRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          refetch(); // Load lại danh sách sau khi tạo xong
        }}
      />
    </div>
  );
}
