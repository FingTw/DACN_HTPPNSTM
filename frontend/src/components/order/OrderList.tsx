import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Product {
  TenSP: string;
  HinhAnh: string;
  MoTa?: string;
}

interface OrderItem {
  MaSP: string;
  TenSP: string;
  SoLuong: number;
  GiaBan: number;
  MaSP_sanpham: Product;
}

interface Payment {
  TrangThai: string;
  Sotien: number;
  NgayTao?: string;
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
  thanhtoans?: Payment[];
}

interface StatusCounts {
  [key: string]: number;
}

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({});
  const [activeTab, setActiveTab] = useState<string>('Tất cả');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  const statusTabs = [
    { key: 'Tất cả', icon: '📦' },
    { key: 'Chờ xác nhận', icon: '⏳' },
    { key: 'Chờ lấy hàng', icon: '📥' },
    { key: 'Chờ giao hàng', icon: '🚚' },
    { key: 'Đã giao hàng', icon: '📬' }, 
    { key: 'Lịch sử', icon: '📋' },     
    { key: 'Đã hủy', icon: '❌' }
  ];

  const fetchAllOrders = async () => {
    try {
      console.log("🔄 Bắt đầu fetch orders...");
      setError('');
      setLoading(true);

      const token = localStorage.getItem('token');
      console.log("🔑 Token từ localStorage:", token ? 'Có' : 'Không');

      if (!token) {
        setError('Chưa đăng nhập. Vui lòng đăng nhập lại.');
        setLoading(false);
        return;
      }

      const response = await axios.get('http://localhost:3000/api/order/all', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("✅ Response từ API:", response.data);
      
      if (response.data.success) {
        setOrders(response.data.data.orders);
        setStatusCounts(response.data.data.statusCounts);
        console.log(`📦 Nhận được ${response.data.data.orders.length} đơn hàng`);
      } else {
        setError('Không thể lấy danh sách đơn hàng');
      }
    } catch (error: any) {
      console.error('❌ Lỗi khi lấy đơn hàng:', error);
      if (error.response) {
        console.log('📊 Error response:', error.response.data);
        setError(`Lỗi: ${error.response.data.message || 'Không thể kết nối đến server'}`);
      } else if (error.request) {
        setError('Không thể kết nối đến server. Kiểm tra kết nối mạng.');
      } else {
        setError('Có lỗi xảy ra khi tải đơn hàng');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersByStatus = async (status: string) => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Chưa đăng nhập. Vui lòng đăng nhập lại.');
        return;
      }

      // 🆕 XỬ LÝ TAB "LỊCH SỬ" - LẤY CẢ "Hoàn thành" VÀ "Trả hàng"
      let apiStatus = status;
      if (status === 'Lịch sử') {
        // Không gửi filter status cho tab Lịch sử, sẽ filter ở client
        apiStatus = 'Tất cả';
      }

      const response = await axios.get(`http://localhost:3000/api/order/status/${encodeURIComponent(apiStatus)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        let filteredOrders = response.data.data;
        
        // 🆕 FILTER CLIENT CHO TAB "LỊCH SỬ"
        if (status === 'Lịch sử') {
          filteredOrders = response.data.data.filter((order: Order) => 
            order.TrangThai === 'Hoàn thành' || order.TrangThai === 'Trả hàng'
          );
        }
        
        setOrders(filteredOrders);
      }
    } catch (error: any) {
      console.error('Lỗi khi lấy đơn hàng theo trạng thái:', error);
      setError(`Lỗi: ${error.response?.data?.message || 'Không thể tải đơn hàng'}`);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const handleTabClick = async (tab: string) => {
    setActiveTab(tab);
    setLoading(true);
    
    if (tab === 'Tất cả') {
      await fetchAllOrders();
    } else {
      await fetchOrdersByStatus(tab);
    }
    setLoading(false);
  };

  const handleConfirmReceived = async (orderId: string) => {
    if (window.confirm('Bạn đã nhận được hàng? Xác nhận này sẽ hoàn tất đơn hàng.')) {
      try {
        setUpdatingOrder(orderId);
        const token = localStorage.getItem('token');
        
        const response = await axios.put(`http://localhost:3000/api/order/update-status/${orderId}`, {
          TrangThai: 'Hoàn thành'
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          alert('✅ Đã xác nhận nhận hàng! Cảm ơn bạn đã mua sắm.');
          // Refresh danh sách
          if (activeTab === 'Đã giao hàng') {
            await fetchOrdersByStatus('Đã giao hàng');
          } else {
            fetchAllOrders();
          }
        } else {
          alert('❌ Có lỗi xảy ra: ' + response.data.message);
        }
      } catch (error: any) {
        console.error('Lỗi khi xác nhận nhận hàng:', error);
        alert('❌ Có lỗi xảy ra khi xác nhận nhận hàng: ' + 
          (error.response?.data?.message || 'Lỗi không xác định'));
      } finally {
        setUpdatingOrder(null);
      }
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
      try {
        setUpdatingOrder(orderId);
        const token = localStorage.getItem('token');
        const response = await axios.put(`http://localhost:3000/api/order/update-status/${orderId}`, {
          TrangThai: 'Đã hủy'
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          alert('✅ Đã hủy đơn hàng thành công!');
          fetchAllOrders();
        } else {
          alert('❌ Có lỗi xảy ra: ' + response.data.message);
        }
      } catch (error: any) {
        console.error('Lỗi khi hủy đơn hàng:', error);
        alert('❌ Có lỗi xảy ra khi hủy đơn hàng: ' + 
          (error.response?.data?.message || 'Lỗi không xác định'));
      } finally {
        setUpdatingOrder(null);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="text-center py-10 text-lg text-gray-600">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          Đang tải đơn hàng...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="text-center py-10">
          <div className="text-red-500 text-lg mb-4">❌ {error}</div>
          <button 
            onClick={fetchAllOrders}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 font-sans">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Đơn hàng của tôi</h1>
      
      {/* Tab trạng thái */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4 overflow-x-auto pt-4">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg border-none cursor-pointer relative transition-all min-w-[80px] mx-1 ${
              activeTab === tab.key 
                ? 'bg-green-50 border-2 border-green-500' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => handleTabClick(tab.key)}
          >
            <span className="text-lg mb-1">{tab.icon}</span>
            <span className={`text-xs font-medium text-center leading-tight ${
              activeTab === tab.key ? 'text-green-600 font-semibold' : 'text-gray-600'
            }`}>
              {tab.key}
            </span>
            
            {/* Hiển thị số lượng cho các trạng thái quan trọng */}
            {['Chờ xác nhận', 'Chờ lấy hàng', 'Chờ giao hàng', 'Đã giao hàng', 'Lịch sử'].includes(tab.key) && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {tab.key === 'Lịch sử' 
                  ? (statusCounts['Hoàn thành'] || 0) + (statusCounts['Trả hàng'] || 0) // 🆕 TÍNH TỔNG CHO LỊCH SỬ
                  : statusCounts[tab.key] || 0
                }
              </span>
            )}
            
            {/* Hiển thị tổng số đơn cho tab "Tất cả" */}
            {tab.key === 'Tất cả' && (statusCounts['Tất cả'] || 0) > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {statusCounts['Tất cả']}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Danh sách đơn hàng */}
      <div>
        {orders.length === 0 ? (
          <div className="text-center py-10 text-gray-600 bg-gray-50 rounded-lg">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-lg mb-2">Không có đơn hàng nào</p>
            <p className="text-sm text-gray-500">
              {activeTab === 'Đã giao hàng' 
                ? 'Chưa có đơn hàng nào đã được giao' 
                : activeTab === 'Lịch sử'
                ? 'Chưa có đơn hàng nào trong lịch sử' // 🆕 THÔNG BÁO CHO LỊCH SỬ
                : 'Hãy bắt đầu mua sắm và đặt hàng!'}
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Mua sắm ngay
            </button>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.MaDH} className="border border-gray-200 rounded-lg mb-4 p-5 bg-white shadow-sm">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                <div className="flex-1">
                  <h3 className="m-0 mb-1 text-gray-800 text-base font-semibold">Mã đơn: {order.MaDH}</h3>
                  <p className="m-0 text-gray-600 text-sm">Ngày đặt: {formatDate(order.NgayTao)}</p>
                  <p className="m-0 text-gray-600 text-sm">
                    {order.MaPTTT_pttt?.TenPTTT} • {order.MaPTVC_ptvc?.TenPTVC}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-4 py-2 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                    order.TrangThai === 'Chờ xác nhận' ? 'bg-yellow-100 text-yellow-800' :
                    order.TrangThai === 'Chờ lấy hàng' ? 'bg-blue-100 text-blue-800' :
                    order.TrangThai === 'Chờ giao hàng' ? 'bg-cyan-100 text-cyan-800' :
                    order.TrangThai === 'Đã giao hàng' ? 'bg-purple-100 text-purple-800' :
                    order.TrangThai === 'Hoàn thành' ? 'bg-green-100 text-green-800' :
                    order.TrangThai === 'Trả hàng' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {order.TrangThai === 'Chờ xác nhận' && '⏳'}
                    {order.TrangThai === 'Chờ lấy hàng' && '📥'}
                    {order.TrangThai === 'Chờ giao hàng' && '🚚'}
                    {order.TrangThai === 'Đã giao hàng' && '📬'}
                    {order.TrangThai === 'Hoàn thành' && '✅'}
                    {order.TrangThai === 'Trả hàng' && '🔄'}
                    {order.TrangThai === 'Đã hủy' && '❌'}
                    {order.TrangThai}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                {order.chitiet_donhangs?.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-b-0">
                    <img 
                      src={item.MaSP_sanpham?.HinhAnh || '/images/default-product.jpg'} 
                      alt={item.TenSP}
                      className="w-15 h-15 object-cover rounded border border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/default-product.jpg';
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="m-0 mb-1 text-sm font-medium text-gray-800">{item.TenSP}</h4>
                      <p className="m-0 text-xs text-gray-600">Số lượng: {item.SoLuong}</p>
                      <p className="m-0 text-sm text-red-600 font-semibold">{formatCurrency(item.GiaBan)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="text-base font-semibold text-gray-800">
                  Tổng tiền: {formatCurrency(order.TongTien)}
                  {order.GiamGia > 0 && (
                    <span className="text-sm text-green-600 ml-2">
                      (Đã giảm: {formatCurrency(order.GiamGia)})
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    className="px-4 py-2 border border-blue-500 rounded bg-white text-blue-500 cursor-pointer transition-all text-sm hover:bg-blue-500 hover:text-white flex items-center gap-1"
                    onClick={() => window.location.href = `/order-detail/${order.MaDH}`}
                  >
                    <span>👁️</span>
                    Xem chi tiết
                  </button>
                  
                  {order.TrangThai === 'Đã giao hàng' && (
                    <button 
                    className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg cursor-pointer transition-all duration-200 text-sm hover:bg-green-700 active:bg-green-800 flex items-center gap-2 shadow-sm hover:shadow disabled:bg-green-300 disabled:cursor-not-allowed disabled:shadow-none"
                    onClick={() => handleConfirmReceived(order.MaDH)}
                    disabled={updatingOrder === order.MaDH}
                  >
                    {updatingOrder === order.MaDH ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Đang xác nhận...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                        <span>Đã nhận hàng</span>
                      </>
                    )}
                  </button>
                  )}
                  
                  {order.TrangThai === 'Chờ xác nhận' && (
                    <button 
                      className="px-4 py-2 border border-red-500 rounded bg-white text-red-500 cursor-pointer transition-all text-sm hover:bg-red-500 hover:text-white flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleCancelOrder(order.MaDH)}
                      disabled={updatingOrder === order.MaDH}
                    >
                      {updatingOrder === order.MaDH ? (
                        <>
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <span>❌</span>
                          Hủy đơn
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderList;