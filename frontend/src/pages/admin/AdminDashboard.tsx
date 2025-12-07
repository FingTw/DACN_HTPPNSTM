// src/pages/admin/AdminDashboard.tsx
import React, { useEffect, useState } from "react";
import {
  Users,
  Store,
  ShoppingCart,
  Box,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { adminService, type SystemStats } from "@/services/adminService";

const StatsCard = ({ title, value, icon: Icon, color, subValue }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon size={24} className={color.replace("bg-", "text-")} />
      </div>
    </div>
    {subValue && (
      <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
        <TrendingUp size={16} className="text-green-500" />
        <span>{subValue}</span>
      </div>
    )}
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const data = await adminService.getStats();
      setStats(data);
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
    );

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">Tổng quan hệ thống</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Tổng người dùng"
          value={stats?.totalUsers.toLocaleString()}
          icon={Users}
          color="bg-blue-500"
          subValue="Người dùng hoạt động"
        />
        <StatsCard
          title="Cửa hàng"
          value={stats?.totalShops.toLocaleString()}
          icon={Store}
          color="bg-emerald-500"
          subValue="Đối tác kinh doanh"
        />
        <StatsCard
          title="Sản phẩm"
          value={stats?.totalProducts.toLocaleString()}
          icon={Box}
          color="bg-purple-500"
          subValue="Mặt hàng đang bán"
        />
        <StatsCard
          title="Tổng doanh thu"
          value={`${(stats?.revenue || 0).toLocaleString()} ₫`}
          icon={DollarSign}
          color="bg-amber-500"
          subValue="Doanh thu toàn sàn"
        />
      </div>

      {/* Biểu đồ hoặc Bảng thống kê chi tiết (Có thể thêm sau) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
        (Khu vực hiển thị biểu đồ tăng trưởng - Đang phát triển)
      </div>
    </div>
  );
};

export default AdminDashboard;
