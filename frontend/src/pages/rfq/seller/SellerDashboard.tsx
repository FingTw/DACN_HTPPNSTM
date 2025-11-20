// src/pages/rfq/seller/SellerDashboard.tsx
import { Link } from "react-router-dom";
import { useMemo } from "react"; // [Sửa 1] Import useMemo
import { Plus, Package, Clock, TrendingUp, CheckCircle } from "lucide-react";
import {
  useSellerStatistics,
  useNewRequests,
  useSellerProposals,
} from "@/hooks/useRFQ";
import StatsCard from "@/components/rfq/StatsCard";
import RequestCard from "@/components/rfq/RequestCard";

const formatDateVN = (date: string) =>
  new Intl.DateTimeFormat("vi-VN").format(new Date(date));

export default function SellerDashboard() {
  const { stats } = useSellerStatistics();
  const { requests: newRequests } = useNewRequests();
  const proposalFilters = useMemo(() => ({ limit: 5 }), []);

  const { proposals, loading: propLoading } = useSellerProposals(
    true,
    proposalFilters
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bảng điều khiển người bán
          </h1>
          <p className="text-gray-600 mt-2">
            Theo dõi đề nghị và tìm kiếm cơ hội cung cấp
          </p>
        </div>
        <Link
          to="/rfq/seller/requests"
          className="flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-lg hover:bg-green-700 transition"
        >
          <Plus className="w-5 h-5" />
          Tìm yêu cầu mới
        </Link>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Tổng đề nghị"
          value={stats?.totalProposals ?? 0}
          icon={Package}
          color="blue"
        />
        <StatsCard
          title="Đang chờ"
          value={stats?.pendingProposals ?? 0}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="Đã chấp nhận"
          value={stats?.acceptedProposals ?? 0}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Doanh thu"
          value={
            stats?.totalRevenue
              ? `${Number(stats.totalRevenue).toLocaleString()} ₫`
              : "0 ₫"
          }
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Yêu cầu mới trong 24h */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Yêu cầu mới (24h gần nhất)</h2>
          <Link
            to="/rfq/seller/requests"
            className="text-blue-600 hover:underline text-sm"
          >
            Xem tất cả →
          </Link>
        </div>
        <div className="divide-y">
          {newRequests.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              Chưa có yêu cầu mới nào
            </div>
          ) : (
            newRequests.map((req) => (
              <RequestCard
                key={req.MaYCDH}
                request={req}
                link={`/rfq/seller/requests/${req.MaYCDH}`}
              />
            ))
          )}
        </div>
      </div>

      {/* Đề nghị gần đây của tôi */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Đề nghị gần đây của tôi</h2>
        </div>
        <div className="divide-y">
          {propLoading ? (
            <div className="p-12 text-center text-gray-500">Đang tải...</div>
          ) : proposals.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              Bạn chưa gửi đề nghị nào
              <Link
                to="/rfq/seller/requests"
                className="block mt-4 text-blue-600 hover:underline"
              >
                Bắt đầu tìm yêu cầu ngay →
              </Link>
            </div>
          ) : (
            proposals.map((prop) => (
              <div
                key={prop.MaDNCC}
                className="p-6 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{prop.MaYCDH}</p>
                    <p className="text-sm text-gray-600">
                      {prop.SoLuongCungCap} × {prop.GiaDeNghi.toLocaleString()}{" "}
                      ₫ • Gửi {formatDateVN(prop.NgayDeNghi)}
                    </p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      prop.TrangThai === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : prop.TrangThai === "Accepted"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {prop.TrangThai === "Pending" && "Đang chờ"}
                    {prop.TrangThai === "Accepted" && "Đã chấp nhận"}
                    {prop.TrangThai === "Rejected" && "Bị từ chối"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
