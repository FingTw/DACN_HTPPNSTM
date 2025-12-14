import React, { useState, useEffect } from "react";
import axios from "axios";

// --- INTERFACES ---
interface Product {
  TenSP: string;
  HinhAnh: string;
  hinhanhs?: { URL: string }[];
  MoTa?: string;
}

interface OrderItem {
  MaSP: string;
  TenSP: string;
  SoLuong: number;
  GiaBan: number;
  MaSP_sanpham: Product;
  // Sửa lỗi interface ở đây
  HinhAnh?: string | null;
}

interface Order {
  MaDH: string;
  MaTK: string;
  DCNhanHang: string;
  TongTien: number;
  GiamGia: number;
  TrangThai: string;
  NgayTao: string;
  chitiet_donhangs: OrderItem[];
  MaPTTT_pttt?: {
    TenPTTT: string;
  };
  MaPTVC_ptvc?: {
    TenPTVC: string;
  };
  giaohangs?: DeliveryInfo[];
}

interface DeliveryInfo {
  MaGH: string;
  ProofImage: string | null;
  NgayTao: string;
  TrangThai: string;
}

interface StatusCounts {
  [key: string]: number;
}

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({});
  const [activeTab, setActiveTab] = useState<string>("Tất cả");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const statusTabs = [
    { key: "Tất cả", icon: "📦" },
    { key: "Chờ xác nhận", icon: "⏳" },
    { key: "Đang giao hàng", icon: "📥" },
    { key: "Đã giao", icon: "📬" },
    { key: "Lịch sử", icon: "📋" },
    { key: "Đã hủy", icon: "❌" },
  ];

  // --- API CALLS ---
  const fetchAllOrders = async () => {
    try {
      setError("");
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        setLoading(false);
        return;
      }

      const response = await axios.get("http://localhost:3000/api/order/all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setOrders(response.data.data.orders);
        setStatusCounts(response.data.data.statusCounts);
      } else {
        setError("Không thể tải dữ liệu đơn hàng.");
      }
    } catch (error: any) {
      console.error(error);
      setError("Lỗi kết nối server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersByStatus = async (status: string) => {
    try {
      setError("");
      const token = localStorage.getItem("token");
      if (!token) return;

      let apiStatus = status;
      if (status === "Lịch sử") apiStatus = "Tất cả";

      const response = await axios.get(
        `http://localhost:3000/api/order/status/${encodeURIComponent(
          apiStatus
        )}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        let filteredOrders = response.data.data;
        if (status === "Lịch sử") {
          filteredOrders = response.data.data.filter(
            (order: Order) =>
              order.TrangThai === "Hoàn thành" || order.TrangThai === "Trả hàng"
          );
        }
        setOrders(filteredOrders);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const handleTabClick = async (tab: string) => {
    setActiveTab(tab);
    setLoading(true);
    if (tab === "Tất cả") {
      await fetchAllOrders();
    } else {
      await fetchOrdersByStatus(tab);
    }
    setLoading(false);
  };

  // --- ACTIONS ---
  const handleConfirmReceived = async (orderId: string) => {
    if (
      window.confirm("Xác nhận bạn đã nhận được hàng và hài lòng với sản phẩm?")
    ) {
      try {
        setUpdatingOrder(orderId);
        const token = localStorage.getItem("token");
        const response = await axios.put(
          `http://localhost:3000/api/order/update-status/${orderId}`,
          { TrangThai: "Hoàn thành" },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          if (activeTab === "Đã giao") await fetchOrdersByStatus("Đã giao");
          else fetchAllOrders();
        }
      } catch (error) {
        alert("Lỗi khi cập nhật trạng thái");
      } finally {
        setUpdatingOrder(null);
      }
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (window.confirm("Bạn chắc chắn muốn hủy đơn hàng này?")) {
      try {
        setUpdatingOrder(orderId);
        const token = localStorage.getItem("token");
        const response = await axios.put(
          `http://localhost:3000/api/order/update-status/${orderId}`,
          { TrangThai: "Đã hủy" },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          fetchAllOrders();
        }
      } catch (error) {
        alert("Lỗi khi hủy đơn");
      } finally {
        setUpdatingOrder(null);
      }
    }
  };

  // --- UTILS ---
  const getImageUrl = (url?: string) => {
    if (!url) return "/images/default-product.jpg";
    if (url.startsWith("http")) return url;
    return `http://localhost:3000${url.startsWith("/") ? url : `/${url}`}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Helper chọn màu badge trạng thái
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Chờ xác nhận":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Chờ lấy hàng":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Đang giao":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "Đã giao":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Hoàn thành":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Trả hàng":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "Đã hủy":
        return "bg-red-50 text-red-600 border-red-100";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  // --- RENDER ---
  if (loading && orders.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">
          Đang tải đơn hàng của bạn...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center mt-10">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
          <div className="text-4xl mb-4">😕</div>
          <h3 className="text-lg font-bold text-red-800 mb-2">Đã xảy ra lỗi</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={fetchAllOrders}
            className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
          >
            Thử lại ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Đơn hàng của tôi</h1>
          <p className="text-gray-500 mt-2">
            Theo dõi và quản lý lịch sử mua sắm của bạn
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-8 sticky top-4 z-10 overflow-hidden">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            {statusTabs.map((tab) => {
              const count =
                tab.key === "Lịch sử"
                  ? (statusCounts["Hoàn thành"] || 0) +
                    (statusCounts["Trả hàng"] || 0)
                  : statusCounts[tab.key] || 0;

              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabClick(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all whitespace-nowrap relative group ${
                    activeTab === tab.key
                      ? "bg-emerald-50 text-emerald-700 font-bold ring-1 ring-emerald-200"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="text-sm">{tab.key}</span>

                  {/* Badge số lượng */}
                  {count > 0 && tab.key !== "Tất cả" && (
                    <span
                      className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        activeTab === tab.key
                          ? "bg-emerald-200 text-emerald-800"
                          : "bg-gray-200 text-gray-600 group-hover:bg-gray-300"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl opacity-50">📦</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Chưa có đơn hàng nào
              </h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                {activeTab === "Tất cả"
                  ? "Hãy khám phá thêm các sản phẩm nông sản tươi ngon và đặt hàng ngay hôm nay!"
                  : `Bạn không có đơn hàng nào trong mục "${activeTab}"`}
              </p>
              <button
                onClick={() => (window.location.href = "/")}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-200 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          ) : (
            orders.map((order) => {
              // 1. TÍNH TOÁN THÔNG TIN GIAO HÀNG
              const deliveryInfo =
                order.giaohangs && order.giaohangs.length > 0
                  ? order.giaohangs[order.giaohangs.length - 1]
                  : null;

              const showDeliveryProof =
                (order.TrangThai === "Đã giao" ||
                  order.TrangThai === "Hoàn thành") &&
                deliveryInfo &&
                deliveryInfo.ProofImage;

              return (
                <div
                  key={order.MaDH}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
                >
                  {/* Card Header */}
                  <div className="px-6 py-4 border-b border-gray-50 flex flex-wrap items-center justify-between gap-4 bg-gray-50/30">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                        <span className="font-mono font-bold text-gray-600 text-sm">
                          #{order.MaDH}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        <span>{formatDate(order.NgayTao)}</span>
                        <span className="mx-2">•</span>
                        <span className="hidden sm:inline">
                          {order.MaPTTT_pttt?.TenPTTT}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusStyle(
                        order.TrangThai
                      )}`}
                    >
                      {order.TrangThai}
                    </span>
                  </div>

                  {showDeliveryProof && (
                    <div className="mx-6 mt-6 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <span className="text-lg">📸</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 text-sm">
                          Thông tin giao hàng
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 mb-2">
                          Shipper đã giao vào:{" "}
                          <span className="font-medium">
                            {formatDate(deliveryInfo.NgayTao)}
                          </span>
                        </p>

                        {/* Ảnh bằng chứng */}
                        <div className="group relative inline-block">
                          <img
                            src={getImageUrl(deliveryInfo.ProofImage || "")}
                            alt="Proof"
                            className="h-24 w-24 object-cover rounded-lg border border-emerald-200 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() =>
                              setPreviewImage(
                                getImageUrl(deliveryInfo.ProofImage || "")
                              )
                            }
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                            <span className="bg-black/60 text-white text-[10px] px-2 py-1 rounded">
                              Xem
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Product List */}
                  <div className="p-6 space-y-6">
                    {order.chitiet_donhangs?.map((item, index) => {
                      const displayImage = getImageUrl(
                        item.HinhAnh || item.MaSP_sanpham?.HinhAnh
                      );
                      return (
                        <div key={index} className="flex gap-4 group">
                          <div className="w-20 h-20 rounded-xl border border-gray-100 overflow-hidden bg-gray-50 flex-shrink-0">
                            <img
                              src={displayImage}
                              alt={item.TenSP}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/images/default-product.jpg";
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h4 className="font-medium text-gray-800 line-clamp-2 mb-1 group-hover:text-emerald-600 transition-colors">
                              {item.TenSP}
                            </h4>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                                x{item.SoLuong}
                              </span>
                              <span className="font-bold text-gray-900">
                                {formatCurrency(item.GiaBan)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 py-5 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col items-end sm:items-start w-full sm:w-auto">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                        Tổng tiền thanh toán
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-emerald-600">
                          {formatCurrency(order.TongTien)}
                        </span>
                        {order.GiamGia > 0 && (
                          <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                            - {formatCurrency(order.GiamGia)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-white hover:border-gray-300 hover:text-gray-800 transition-all shadow-sm"
                        onClick={() =>
                          (window.location.href = `/order-detail/${order.MaDH}`)
                        }
                      >
                        Xem chi tiết
                      </button>

                      {order.TrangThai === "Đã giao" && (
                        <button
                          className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          onClick={() => handleConfirmReceived(order.MaDH)}
                          disabled={!!updatingOrder}
                        >
                          {updatingOrder === order.MaDH ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <span>Đã nhận hàng</span>
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </>
                          )}
                        </button>
                      )}

                      {order.TrangThai === "Chờ xác nhận" && (
                        <button
                          className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-red-100 text-red-600 bg-red-50 font-medium text-sm hover:bg-red-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          onClick={() => handleCancelOrder(order.MaDH)}
                          disabled={!!updatingOrder}
                        >
                          {updatingOrder === order.MaDH ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <span>Hủy đơn</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderList;
