import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { orderService } from "@/services/orderService";
// import type { Order } from "@/services/orderService"; // Nếu file service chưa export type này thì dùng interface dưới đây

// Định nghĩa Interface ngay tại đây để tránh lỗi typescript nếu service chưa cập nhật
interface OrderDetail {
  MaDH: string;
  NgayTao: string;
  TrangThai: string;
  DCNhanHang: string;
  TongTien: number;
  PhiVanChuyen?: number;
  GiamGia?: number;
  chitiet_donhangs: Array<{
    MaSP: string;
    SoLuong: number;
    GiaBan: number;
    TenSP?: string; // Do backend join bảng
    MaSP_sanpham?: {
      // Hoặc nested object tùy backend trả về
      TenSP: string;
      HinhAnh: string;
    };
  }>;
  MaPTTT_pttt?: { TenPTTT: string };
  MaPTVC_ptvc?: { TenPTVC: string };
}

const OrderSuccessPage: React.FC = () => {
  const { MaDH } = useParams<{ MaDH: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!MaDH) {
        navigate("/");
        return;
      }

      try {
        console.log("Đang lấy thông tin đơn hàng:", MaDH);
        // Gọi API
        const response: any = await orderService.getOrderSuccess(MaDH);

        // LOGIC QUAN TRỌNG: Kiểm tra cấu trúc trả về
        // Backend mới trả về: { success: true, data: orderObject }
        if (response && response.success && response.data) {
          setOrder(response.data);
        }
        // Fallback cho trường hợp Backend cũ trả về raw object
        else if (response && response.MaDH) {
          setOrder(response);
        } else {
          // Thử fallback gọi API getMyOrders nếu API trên thất bại
          console.warn("API success trả về data lạ, thử fallback...");
          const fallbackResponse: any = await orderService.getMyOrders();
          const foundOrder = fallbackResponse.find(
            (o: OrderDetail) => o.MaDH === MaDH
          );
          if (foundOrder) {
            setOrder(foundOrder);
          } else {
            console.error("Không tìm thấy đơn hàng trong fallback.");
          }
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin đơn hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    // Delay nhẹ 500ms để đảm bảo DB đã lưu xong (fix race condition)
    const timer = setTimeout(() => {
      fetchOrderDetail();
    }, 500);

    return () => clearTimeout(timer);
  }, [MaDH, navigate]);

  // Format tiền tệ
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            ?
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Đang xử lý đơn hàng
          </h2>
          <p className="text-gray-600 mb-6">
            Hệ thống đang cập nhật đơn hàng <b>#{MaDH}</b>. Vui lòng kiểm tra
            lại trong mục "Đơn hàng của tôi".
          </p>
          <Link
            to="/orders"
            className="block w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium"
          >
            Vào danh sách đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 font-sans">
      <div className="max-w-3xl mx-auto px-4">
        {/* Card Thành công */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="bg-emerald-600 p-8 text-center text-white">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Đặt hàng thành công!</h1>
            <p className="text-emerald-100">
              Mã đơn hàng:{" "}
              <span className="font-mono font-bold bg-white/20 px-2 py-1 rounded">
                {order.MaDH}
              </span>
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Phương thức thanh toán</p>
                <p className="font-medium text-gray-900">
                  {order.MaPTTT_pttt?.TenPTTT || "Thanh toán khi nhận hàng"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Địa chỉ nhận hàng</p>
                <p className="font-medium text-gray-900 line-clamp-2">
                  {order.DCNhanHang}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Ngày đặt hàng</p>
                <p className="font-medium text-gray-900">
                  {new Date(order.NgayTao).toLocaleDateString("vi-VN")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Trạng thái hiện tại</p>
                <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold">
                  {order.TrangThai}
                </span>
              </div>
            </div>

            {/* Danh sách sản phẩm */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-bold text-gray-800 mb-4">
                Chi tiết sản phẩm
              </h3>
              <div className="space-y-4">
                {order.chitiet_donhangs?.map((item, idx) => {
                  // Lấy tên và ảnh từ nested object nếu có
                  const productName =
                    item.TenSP || item.MaSP_sanpham?.TenSP || item.MaSP;

                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-center group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-bold">
                          {item.SoLuong}x
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {productName}
                          </p>
                        </div>
                      </div>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(item.GiaBan * item.SoLuong)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tổng tiền */}
            <div className="border-t-2 border-dashed border-gray-100 mt-6 pt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span>
                <span>
                  {formatCurrency(
                    (order.TongTien || 0) -
                      (order.PhiVanChuyen || 0) +
                      (order.GiamGia || 0)
                  )}
                </span>
              </div>
              {order.PhiVanChuyen && (
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span>{formatCurrency(order.PhiVanChuyen)}</span>
                </div>
              )}
              {order.GiamGia && order.GiamGia > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatCurrency(order.GiamGia)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100">
                <span className="font-bold text-lg text-gray-800">
                  Tổng thanh toán
                </span>
                <span className="font-bold text-xl text-emerald-600">
                  {formatCurrency(order.TongTien)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/"
            className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-center hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            Về trang chủ
          </Link>
          <Link
            to="/orders"
            className="flex-1 py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-center hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
          >
            Theo dõi đơn hàng
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
