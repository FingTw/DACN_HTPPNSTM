// src/pages/OrderSuccessPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orderService } from '@/services/orderService';
import type { Order } from '@/services/orderService'; // ← THÊM import type

const OrderSuccessPage: React.FC = () => {
  const { MaDH } = useParams<{ MaDH: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!MaDH) {
        navigate('/');
        return;
      }
      
      try {
        // SỬA: Sử dụng getOrderSuccess thay vì getMyOrders
        const orderDetail = await orderService.getOrderSuccess(MaDH);
        setOrder(orderDetail);
      } catch (error) {
        console.error('Lỗi lấy thông tin đơn hàng:', error);
        // Fallback: thử dùng getMyOrders nếu getOrderSuccess không hoạt động
        try {
          const orders = await orderService.getMyOrders();
          if (orders) {
            const currentOrder = orders.find(order => order.MaDH === MaDH);
            setOrder(currentOrder || null);
          }
        } catch (fallbackError) {
          console.error('Fallback cũng lỗi:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [MaDH, navigate]);

  // ... phần còn lại của component giữ nguyên
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(item => (
                <div key={item} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Không tìm thấy đơn hàng
            </h2>
            <Link
              to="/"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header thành công */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Đặt hàng thành công!</h1>
          <p className="text-gray-600">
            Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Thông tin đơn hàng</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Mã đơn hàng</p>
              <p className="font-semibold">{order.MaDH}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ngày đặt</p>
              <p className="font-semibold">
                {order.NgayTao ? new Date(order.NgayTao).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Trạng thái</p>
              <p className="font-semibold text-green-600">{order.TrangThai}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Địa chỉ giao hàng</p>
              <p className="font-semibold">{order.DCNhanHang}</p>
            </div>
          </div>

          {/* Hiển thị chi tiết sản phẩm nếu có */}
          {order.chitiet_donhangs && order.chitiet_donhangs.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Sản phẩm đã đặt</h3>
              <div className="space-y-3">
                {order.chitiet_donhangs.map((item) => (
                  <div key={item.MaSP} className="flex justify-between items-center border-b pb-3 last:border-b-0">
                    <div>
                      <p className="font-medium">{item.TenSP}</p>
                      <p className="text-sm text-gray-600">Số lượng: {item.SoLuong}</p>
                    </div>
                    <p className="font-semibold">
                      {(item.GiaBan * item.SoLuong).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between text-lg font-bold border-t pt-4">
            <span>Tổng thanh toán</span>
            <span className="text-green-600">{order.TongTien?.toLocaleString('vi-VN') || '0'}đ</span>
          </div>

          <div className="flex gap-3 mt-6">
            <Link
              to="/"
              className="flex-1 bg-green-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Tiếp tục mua sắm
            </Link>
            
            <Link
              to="/orders"
              className="flex-1 border border-green-600 text-green-600 text-center py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
            >
              Xem đơn hàng của tôi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;