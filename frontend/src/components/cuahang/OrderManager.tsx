// components/cuahang/OrderManager.tsx
import React, { useState, useEffect, useCallback } from "react";
import type { Store, Product } from "./store";

// 🟢 STATUS MAPPING - LOGIC CHUẨN
const STATUS_MAPPING = {
  "Chờ xác nhận": "cho_xac_nhan",
  "Đang chuẩn bị hàng": "dang_chuan_bi",
  "Chờ lấy hàng": "cho_lay_hang",
  "Đang giao hàng": "dang_giao_hang",
  "Hoàn thành": "hoan_thanh",
  "Đã hủy": "da_huy",
} as const;

const REVERSE_STATUS_MAPPING = {
  cho_xac_nhan: "Chờ xác nhận",
  dang_chuan_bi: "Đang chuẩn bị hàng",
  cho_lay_hang: "Chờ lấy hàng",
  dang_giao_hang: "Đang giao hàng",
  hoan_thanh: "Hoàn thành",
  da_huy: "Đã hủy",
} as const;

interface OrderManagerProps {
  store: Store;
  isOwner: boolean;
  onOrdersUpdate?: () => void;
}

export interface Order {
  MaDH: string;
  MaCH: string;
  MaTK: string;
  TrangThai:
    | "cho_xac_nhan" // Chờ xác nhận
    | "dang_chuan_bi" // Đang chuẩn bị hàng
    | "cho_lay_hang" // Chờ lấy hàng
    | "dang_giao_hang" // Đang giao hàng
    | "hoan_thanh" // Hoàn thành
    | "da_huy"; // Đã hủy
  TongTien: number;
  PhiVanChuyen: number;
  GiamGia: number;
  GhiChu?: string;
  NgayTao: string;
  NgayCapNhat: string;

  DiaChiGiaoHang?: {
    HoTen: string;
    SoDienThoai: string;
    DiaChi: string;
    GhiChu?: string;
  };

  chiTietDonHang?: OrderItem[];

  khachHang?: {
    MaTK: string;
    TenDangNhap: string;
    Email: string;
  };
}

export interface OrderItem {
  MaCTDH: string;
  MaDH: string;
  MaSP: string;
  SoLuong: number;
  DonGia: number;
  ThanhTien: number;
  sanPham?: Product;
}

// 🟢 CONSTANTS
const API_BASE_URL = "http://localhost:3000/api";

// 🟢 UTILITY FUNCTIONS
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getAuthToken = (): string | null => {
  const tokenKeys = ["token", "authToken", "accessToken", "jwtToken"];
  for (const key of tokenKeys) {
    const token = localStorage.getItem(key);
    if (token) return token;
  }
  return null;
};

// 🟢 STATUS CONFIG - LOGIC CHUẨN: Chờ xác nhận -> Đang chuẩn bị -> Chờ lấy hàng -> Đang giao hàng -> Hoàn thành
const ORDER_STATUS_CONFIG = {
  cho_xac_nhan: {
    label: "Chờ xác nhận",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    nextAction: "Xác nhận đơn hàng",
    nextStatus: "dang_chuan_bi" as const,
    description: "Đơn hàng đang chờ cửa hàng xác nhận",
    nextStep: "Đang chuẩn bị hàng",
  },
  dang_chuan_bi: {
    label: "Đang chuẩn bị hàng",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    nextAction: "Hoàn tất chuẩn bị",
    nextStatus: "cho_lay_hang" as const,
    description: "Cửa hàng đang chuẩn bị hàng",
    nextStep: "Chờ lấy hàng",
  },
  cho_lay_hang: {
    label: "Chờ lấy hàng",
    color: "bg-purple-100 text-purple-800 border-purple-300",
    nextAction: "Đã giao cho vận chuyển",
    nextStatus: "dang_giao_hang" as const,
    description: "Chờ đơn vị vận chuyển đến lấy hàng",
    nextStep: "Đang giao hàng",
  },
  dang_giao_hang: {
    label: "Đang giao hàng",
    color: "bg-indigo-100 text-indigo-800 border-indigo-300",
    nextAction: "Giao hàng thành công",
    nextStatus: "hoan_thanh" as const,
    description: "Đơn vị vận chuyển đang giao hàng",
    nextStep: "Hoàn thành",
  },
  hoan_thanh: {
    label: "Hoàn thành",
    color: "bg-green-100 text-green-800 border-green-300",
    nextAction: null,
    nextStatus: null,
    description: "Đơn hàng đã giao thành công",
    nextStep: null,
  },
  da_huy: {
    label: "Đã hủy",
    color: "bg-red-100 text-red-800 border-red-300",
    nextAction: null,
    nextStatus: null,
    description: "Đơn hàng đã bị hủy",
    nextStep: null,
  },
};

// 🟢 ORDER CARD COMPONENT
interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: Order["TrangThai"]) => void;
  loading: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onStatusUpdate,
  loading,
}) => {
  const statusConfig = ORDER_STATUS_CONFIG[order.TrangThai] || {
    label: `Lỗi: ${order.TrangThai}`,
    color: "bg-gray-100 text-gray-800 border-gray-300",
    nextAction: null,
    nextStatus: null,
    description: "Trạng thái không xác định",
    nextStep: null,
  };
  const hasNextAction = statusConfig.nextAction !== null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">
            Đơn hàng #{order.MaDH}
          </h3>
          <p className="text-gray-600 text-sm">{formatDate(order.NgayTao)}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold border ${statusConfig.color}`}
        >
          {statusConfig.label}
        </span>
      </div>

      {/* Customer Info */}
      <div className="mb-4">
        <p className="font-semibold text-gray-900">
          👤 {order.khachHang?.TenDangNhap || "Khách hàng"}
        </p>
        {order.DiaChiGiaoHang && (
          <div className="text-gray-600 text-sm mt-1 space-y-1">
            <p>📍 {order.DiaChiGiaoHang.DiaChi}</p>
            <p>📞 {order.DiaChiGiaoHang.SoDienThoai}</p>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="mb-4 space-y-2">
        {order.chiTietDonHang?.slice(0, 3).map((item) => (
          <div key={item.MaCTDH} className="flex justify-between text-sm">
            <span className="text-gray-700 flex-1">
              {item.sanPham?.TenSP || "Sản phẩm"} × {item.SoLuong}
            </span>
            <span className="text-gray-900 font-medium">
              {formatCurrency(item.ThanhTien)}
            </span>
          </div>
        ))}
        {order.chiTietDonHang && order.chiTietDonHang.length > 3 && (
          <p className="text-gray-500 text-xs">
            +{order.chiTietDonHang.length - 3} sản phẩm khác
          </p>
        )}
      </div>

      {/* Order Summary */}
      <div className="border-t border-gray-200 pt-4 space-y-2">
        {(() => {
          const tongTien = order.TongTien || 0;
          const phiVanChuyen = order.PhiVanChuyen || 0;
          const giamGia = order.GiamGia || 0;

          if (phiVanChuyen > 0 || giamGia > 0) {
            const tongTienHang = tongTien - phiVanChuyen + giamGia;

            return (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tổng tiền hàng:</span>
                  <span className="font-medium">
                    {formatCurrency(tongTienHang)}
                  </span>
                </div>

                {phiVanChuyen > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span className="font-medium">
                      {formatCurrency(phiVanChuyen)}
                    </span>
                  </div>
                )}

                {giamGia > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Giảm giá:</span>
                    <span className="font-medium">
                      -{formatCurrency(giamGia)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span className="text-gray-900">Tổng thanh toán:</span>
                  <span className="text-green-600">
                    {formatCurrency(tongTien)}
                  </span>
                </div>
              </>
            );
          } else {
            return (
              <div className="flex justify-between text-lg font-bold">
                <span className="text-gray-900">Tổng thanh toán:</span>
                <span className="text-green-600">
                  {formatCurrency(tongTien)}
                </span>
              </div>
            );
          }
        })()}
      </div>

      {/* Actions */}
      {hasNextAction && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="mb-3 text-sm text-gray-600 text-center">
            <span className="font-medium">Chuyển sang: </span>
            <span className="text-blue-600 font-semibold">
              {statusConfig.nextStep}
            </span>
          </div>
          <button
            onClick={() => onStatusUpdate(order.MaDH, statusConfig.nextStatus!)}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-2 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang xử lý...
              </>
            ) : (
              <>
                <span>✅</span>
                {statusConfig.nextAction}
              </>
            )}
          </button>
        </div>
      )}

      {/* Status Description */}
      <div className="mt-3 text-xs text-gray-500 text-center">
        {statusConfig.description}
      </div>

      {/* Progress Indicator */}
      {order.TrangThai !== "da_huy" && order.TrangThai !== "hoan_thanh" && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Tiến trình đơn hàng:</span>
            <span>
              {Math.round(
                ((ORDER_STATUSES.indexOf(order.TrangThai) + 1) /
                  ORDER_STATUSES.length) *
                  100
              )}
              %
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${
                  ((ORDER_STATUSES.indexOf(order.TrangThai) + 1) /
                    ORDER_STATUSES.length) *
                  100
                }%`,
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

// 🟢 STATS CARD COMPONENT
interface StatsCardProps {
  title: string;
  value: number;
  color: string;
  icon: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, color, icon }) => (
  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div
        className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}
      >
        <span className="text-xl">{icon}</span>
      </div>
    </div>
  </div>
);

// 🟢 ORDER STATUS FLOW (cho progress indicator)
const ORDER_STATUSES: Order["TrangThai"][] = [
  "cho_xac_nhan",
  "dang_chuan_bi",
  "cho_lay_hang",
  "dang_giao_hang",
  "hoan_thanh",
];

// 🟢 MAIN COMPONENT
const OrderManager: React.FC<OrderManagerProps> = ({
  store,
  isOwner,
  onOrdersUpdate,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<
    Order["TrangThai"] | "all"
  >("all");

  // 🟢 API CONFIG
  const API_CONFIG = {
    getOrders: `${API_BASE_URL}/order/cua-hang/${store.MaCH}`,
    updateStatus: (maDH: string) =>
      `${API_BASE_URL}/order/${maDH}/trang-thai-cua-hang`,
  };

  // 🟢 FETCH ORDERS
  const fetchOrders = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const token = getAuthToken();

      if (!token) {
        console.log("❌ Không có token");
        setOrders([]);
        return;
      }

      const response = await fetch(API_CONFIG.getOrders, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const ordersData = data.data?.orders || data.data || data.orders || [];

        // 🟢 NORMALIZE DỮ LIỆU - CHUYỂN ĐỔI TRẠNG THÁI
        const normalizedOrders = ordersData.map((order: any) => ({
          ...order,
          TrangThai:
            STATUS_MAPPING[order.TrangThai as keyof typeof STATUS_MAPPING] ||
            order.TrangThai,
        }));

        setOrders(Array.isArray(normalizedOrders) ? normalizedOrders : []);
      } else {
        console.error("❌ API returned success: false", data.message);
        setOrders([]);
      }
    } catch (error) {
      console.error("❌ Lỗi khi tải đơn hàng:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [store.MaCH]);

  // 🟢 UPDATE ORDER STATUS - FIXED VERSION
  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: Order["TrangThai"]
  ): Promise<void> => {
    try {
      setUpdating(true);
      const token = getAuthToken();

      if (!token) {
        alert("❌ Vui lòng đăng nhập lại");
        return;
      }

      // 🟢 LẤY TRẠNG THÁI HIỆN TẠI TỪ STATE
      const currentOrder = orders.find((o) => o.MaDH === orderId);
      if (!currentOrder) {
        alert("❌ Không tìm thấy đơn hàng");
        return;
      }

      const currentStatus = currentOrder.TrangThai;
      const beStatus = REVERSE_STATUS_MAPPING[newStatus];
      const currentBeStatus = REVERSE_STATUS_MAPPING[currentStatus];

      console.log("🔄 Chuyển trạng thái:", {
        orderId,
        from: currentBeStatus,
        to: beStatus,
      });

      const response = await fetch(API_CONFIG.updateStatus(orderId), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          TrangThai: beStatus,
          CurrentTrangThai: currentBeStatus,
          MaCH: store.MaCH,
          GhiChu: `Chuyển từ "${currentBeStatus}" sang "${beStatus}"`,
        }),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("❌ Cannot parse response:", responseText);
        return;
      }

      if (response.status === 403) {
        alert(`❌ ${data.message || "Không có quyền"}`);
        return;
      }

      if (data.success) {
        // 🟢 CẬP NHẬT STATE NGAY LẬP TỨC
        setOrders((prev) =>
          prev.map((order) =>
            order.MaDH === orderId
              ? {
                  ...order,
                  TrangThai: newStatus,
                  NgayCapNhat: new Date().toISOString(),
                }
              : order
          )
        );

        // 🟢 LÀM MỚI DANH SÁCH SAU 2 GIÂY ĐỂ ĐỒNG BỘ
        setTimeout(() => {
          fetchOrders();
        }, 2000);

        onOrdersUpdate?.();
        alert(
          `✅ Đã chuyển sang "${ORDER_STATUS_CONFIG[newStatus].label}" thành công!`
        );
      } else {
        if (data.message?.includes("Không thể chuyển từ")) {
          fetchOrders(); // Làm mới để đồng bộ với database
        }
        alert(data.message || "Lỗi khi cập nhật trạng thái");
      }
    } catch (error) {
      console.error("❌ Lỗi:", error);
      alert("Lỗi khi cập nhật trạng thái đơn hàng");
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (store?.MaCH && isOwner) {
      fetchOrders();
    }
  }, [store?.MaCH, isOwner, fetchOrders]);

  // 🟢 FILTERED ORDERS
  const filteredOrders =
    selectedStatus === "all"
      ? orders
      : orders.filter((order) => order.TrangThai === selectedStatus);

  // 🟢 STATISTICS
  const stats = {
    total: orders.length,
    cho_xac_nhan: orders.filter((o) => o.TrangThai === "cho_xac_nhan").length,
    dang_chuan_bi: orders.filter((o) => o.TrangThai === "dang_chuan_bi").length,
    cho_lay_hang: orders.filter((o) => o.TrangThai === "cho_lay_hang").length,
    dang_giao_hang: orders.filter((o) => o.TrangThai === "dang_giao_hang")
      .length,
    hoan_thanh: orders.filter((o) => o.TrangThai === "hoan_thanh").length,
    da_huy: orders.filter((o) => o.TrangThai === "da_huy").length,
  };

  if (!isOwner) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl border border-gray-200 p-12 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="text-3xl">🚫</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">
          Không có quyền truy cập
        </h3>
        <p className="text-gray-600 text-lg">
          Chỉ chủ cửa hàng mới có quyền quản lý đơn hàng
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
          <div className="mb-6 lg:mb-0">
            <h2 className="text-3xl font-bold mb-3">📦 Quản lý Đơn hàng</h2>
            <p className="text-purple-100 text-lg">
              Theo dõi và quản lý tất cả đơn hàng của cửa hàng
            </p>
          </div>
          <button
            onClick={fetchOrders}
            className="bg-white text-purple-600 hover:bg-purple-50 px-6 py-3 rounded-xl font-bold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <span>🔄</span>
            Làm mới
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
        <StatsCard
          title="Tổng đơn"
          value={stats.total}
          color="bg-gradient-to-br from-gray-100 to-gray-200"
          icon="📦"
        />
        <StatsCard
          title="Chờ xác nhận"
          value={stats.cho_xac_nhan}
          color="bg-gradient-to-br from-yellow-100 to-yellow-200"
          icon="⏳"
        />
        <StatsCard
          title="Đang chuẩn bị"
          value={stats.dang_chuan_bi}
          color="bg-gradient-to-br from-blue-100 to-blue-200"
          icon="👨‍🍳"
        />
        <StatsCard
          title="Chờ lấy hàng"
          value={stats.cho_lay_hang}
          color="bg-gradient-to-br from-purple-100 to-purple-200"
          icon="🚚"
        />
        <StatsCard
          title="Đang giao"
          value={stats.dang_giao_hang}
          color="bg-gradient-to-br from-indigo-100 to-indigo-200"
          icon="📦"
        />
        <StatsCard
          title="Hoàn thành"
          value={stats.hoan_thanh}
          color="bg-gradient-to-br from-green-100 to-green-200"
          icon="✅"
        />
        <StatsCard
          title="Đã hủy"
          value={stats.da_huy}
          color="bg-gradient-to-br from-red-100 to-red-200"
          icon="❌"
        />
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all" as const, label: "Tất cả", count: stats.total },
            {
              key: "cho_xac_nhan" as const,
              label: "Chờ xác nhận",
              count: stats.cho_xac_nhan,
            },
            {
              key: "dang_chuan_bi" as const,
              label: "Đang chuẩn bị",
              count: stats.dang_chuan_bi,
            },
            {
              key: "cho_lay_hang" as const,
              label: "Chờ lấy hàng",
              count: stats.cho_lay_hang,
            },
            {
              key: "dang_giao_hang" as const,
              label: "Đang giao",
              count: stats.dang_giao_hang,
            },
            {
              key: "hoan_thanh" as const,
              label: "Hoàn thành",
              count: stats.hoan_thanh,
            },
            { key: "da_huy" as const, label: "Đã hủy", count: stats.da_huy },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setSelectedStatus(key)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                selectedStatus === key
                  ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Đang tải đơn hàng...</p>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.MaDH}
              order={order}
              onStatusUpdate={handleUpdateOrderStatus}
              loading={updating}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-4xl">📦</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            {selectedStatus === "all"
              ? "Chưa có đơn hàng nào"
              : "Không có đơn hàng"}
          </h3>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            {selectedStatus === "all"
              ? "Các đơn hàng từ khách hàng sẽ xuất hiện tại đây"
              : `Không có đơn hàng nào ở trạng thái "${ORDER_STATUS_CONFIG[selectedStatus]?.label}"`}
          </p>
        </div>
      )}
    </div>
  );
};

export default OrderManager;
