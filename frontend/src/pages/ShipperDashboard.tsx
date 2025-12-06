// src/pages/ShipperDashboard.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Search, Filter, Calendar, User, BarChart3, Package, Bell, MapPin, Phone, Mail } from "lucide-react";

interface DeliveryInfo {
  MaGH: string;
  TrangThaiGiaoHang: string;
  ProofImage?: string;
  GhiChu?: string;
  NgayTaoGiaoHang?: string;
}

interface Order {
  MaDH: string;
  DCNhanHang: string;
  TongTien: number;
  PhiVanChuyen: number;
  TrangThai: string;
  MaShipper: string | null;
  MaTK_taikhoan?: {
    HoTen: string;
    SDT: string;
    Email?: string;
    DiaChi?: string;
  };
  MaCH_cuahang?: {
    TenCH: string;
    SDT: string;
    DiaChi: string;
    Email?: string;
  };
  MaPTVC_ptvc?: {
    TenPTVC: string;
  };
  MaPTTT_pttt?: {
    TenPTTT: string;
  };
  NgayTao?: string;
  deliveryInfo?: DeliveryInfo;
  chitiet_donhangs?: Array<{
    TenSP: string;
    SoLuong: number;
    GiaBan: number;
    MaSP_sanpham?: {
      TenSP: string;
      HinhAnh?: string;
    };
  }>;
}

interface ShipperStats {
  stats: {
    total: number;
    delivered: number;
    delivering: number;
    pending: number;
  };
  monthlyRevenue: number;
  unreadNotifications: number;
  shipperInfo: {
    MaTK: string;
    HoTen: string;
    SDT: string;
    Email?: string;
    DiaChi?: string;
    AnhDaiDien?: string;
  };
}

interface MonthlyStat {
  month: string;
  totalOrders: number;
  totalRevenue: number;
  deliveries: Array<{
    MaGH: string;
    MaDH: string;
    revenue: number;
    date: string;
  }>;
}

interface ShipperProfile {
  MaTK: string;
  HoTen: string;
  SDT: string;
  Email: string;
  DiaChi: string;
  AnhDaiDien: string;
  NgayTao: string;
  NgaySinh?: string;
  GioiTinh?: string;
}

interface ImagePreviewModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const ShipperDashboard: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<ShipperStats>({
    stats: { total: 0, delivered: 0, delivering: 0, pending: 0 },
    monthlyRevenue: 0,
    unreadNotifications: 0,
    shipperInfo: { MaTK: '', HoTen: '', SDT: '' }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('available');
  const [acceptingOrder, setAcceptingOrder] = useState<string | null>(null);
  const [deliveringOrder, setDeliveringOrder] = useState<string | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  
  // State cho các chức năng mới
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("Tất cả");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [shipperProfile, setShipperProfile] = useState<ShipperProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showMonthlyStats, setShowMonthlyStats] = useState<boolean>(false);
  const [activeModule, setActiveModule] = useState<string>('dashboard'); // 'dashboard', 'orders', 'stats', 'profile'
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchStats();
    fetchShipperProfile();
  }, [activeTab, activeModule]);

  const fetchOrders = async (searchParams?: any): Promise<void> => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Không tìm thấy token. Vui lòng đăng nhập lại.');
        return;
      }

      let url = `/api/shipper/orders?type=${activeTab}`;
      
      // Nếu có tham số tìm kiếm
      if (searchParams || searchKeyword || filterStatus !== "Tất cả" || startDate || endDate) {
        url = '/api/shipper/search';
        const params = new URLSearchParams();
        
        if (searchKeyword) params.append('keyword', searchKeyword);
        if (filterStatus !== "Tất cả") params.append('status', filterStatus);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.log('❌ Error response:', errorData);
        } catch (e) {
          console.error('❌ Cannot parse error response:', e);
          errorData = { message: 'Lỗi server không xác định' };
        }
        
        if (response.status === 403) {
          toast.error(errorData.message || 'Bạn không có quyền truy cập trang shipper');
          return;
        }
        
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.data || []);
        console.log(`✅ Loaded ${data.data?.length || 0} orders`);
      } else {
        toast.error(data.message || 'Lỗi khi tải đơn hàng');
      }
    } catch (error) {
      console.error('❌ Lỗi lấy đơn hàng:', error);
      toast.error('Lỗi khi tải danh sách đơn hàng: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      console.log('🔄 Fetching stats...');
      
      const response = await fetch('/api/shipper/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.log('Stats API không khả dụng, sử dụng thống kê local');
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
        console.log('✅ Stats loaded:', data.data);
      }
    } catch (error) {
      console.error('❌ Lỗi lấy thống kê:', error);
    }
  };

  const fetchMonthlyStats = async (year?: number, month?: number): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      let url = '/api/shipper/stats/monthly';
      if (year) {
        url += `?year=${year}`;
        if (month) url += `&month=${month}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMonthlyStats(data.data.monthlyStats || []);
          setShowMonthlyStats(true);
        }
      }
    } catch (error) {
      console.error('❌ Lỗi lấy thống kê theo tháng:', error);
      toast.error('Không thể lấy thống kê theo tháng');
    }
  };

  const fetchShipperProfile = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('/api/shipper/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShipperProfile(data.data);
        }
      }
    } catch (error) {
      console.error('❌ Lỗi lấy thông tin shipper:', error);
    }
  };

  const updateShipperProfile = async (updatedProfile: Partial<ShipperProfile>): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Vui lòng đăng nhập lại');
        return;
      }

      const response = await fetch('/api/shipper/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedProfile)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Cập nhật thông tin thành công');
          setShipperProfile(data.data);
          setShowProfileModal(false);
        }
      }
    } catch (error) {
      console.error('❌ Lỗi cập nhật thông tin:', error);
      toast.error('Cập nhật thông tin thất bại');
    }
  };

  const handleAcceptOrder = async (orderId: string): Promise<void> => {
    try {
      setAcceptingOrder(orderId);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Vui lòng đăng nhập lại');
        return;
      }

      const response = await fetch(`/api/shipper/orders/${orderId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Nhận đơn hàng thành công!');
        fetchOrders();
        fetchStats();
      } else {
        throw new Error(data.message || 'Lỗi khi nhận đơn hàng');
      }
    } catch (error) {
      console.error('Lỗi nhận đơn hàng:', error);
      toast.error(error instanceof Error ? error.message : 'Lỗi kết nối khi nhận đơn hàng');
    } finally {
      setAcceptingOrder(null);
    }
  };

    const handleConfirmDelivery = async (orderId: string): Promise<void> => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        setDeliveringOrder(orderId);
        
        // Kiểm tra kích thước file
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Kích thước ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB');
          setDeliveringOrder(null);
          return;
        }
        
        // Kiểm tra định dạng file
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          toast.error('Chỉ chấp nhận file ảnh (JPEG, JPG, PNG, GIF, WebP)');
          setDeliveringOrder(null);
          return;
        }
        
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Vui lòng đăng nhập lại');
          setDeliveringOrder(null);
          return;
        }
        
        // BƯỚC 1: UPLOAD ẢNH
        const formData = new FormData();
        formData.append('image', file);
        
        const note = prompt('Nhập ghi chú giao hàng (nếu có):') || 
                    `Ảnh xác nhận giao hàng đơn ${orderId}`;
        
        console.log('📤 Uploading image...');
        const uploadResponse = await fetch('/api/shipper/upload-proof', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          throw new Error(errorData.message || 'Lỗi upload ảnh');
        }
        
        const uploadData = await uploadResponse.json();
        console.log('✅ Image uploaded:', uploadData);
        
        if (!uploadData.success || !uploadData.data?.imageUrl) {
          throw new Error('Không nhận được URL ảnh từ server');
        }
        
        const imageUrl = uploadData.data.imageUrl;
        const maHA = uploadData.data.maHA;
        
        // BƯỚC 2: XÁC NHẬN GIAO HÀNG
        console.log('📦 Confirming delivery...');
        const confirmResponse = await fetch(`/api/shipper/orders/${orderId}/deliver`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            ProofImage: imageUrl,
            GhiChu: note,
            maHA: maHA || null
          })
        });
        
        if (!confirmResponse.ok) {
          const errorData = await confirmResponse.json().catch(() => ({}));
          throw new Error(errorData.message || `Lỗi xác nhận giao hàng`);
        }
        
        const confirmData = await confirmResponse.json();
        
        if (confirmData.success) {
          toast.success('✅ Xác nhận giao hàng thành công!');
          
          // CẬP NHẬT UI - FIXED VERSION
          setOrders(prevOrders => 
            prevOrders.map(order => {
              if (order.MaDH === orderId) {
                // Tạo deliveryInfo mới với đầy đủ thuộc tính
                const updatedDeliveryInfo: DeliveryInfo = {
                  MaGH: order.deliveryInfo?.MaGH || confirmData.data?.MaGH || `GH_${Date.now()}`, // Fallback
                  TrangThaiGiaoHang: 'ĐÃ_GIAO',
                  ProofImage: imageUrl,
                  GhiChu: note,
                  NgayTaoGiaoHang: new Date().toISOString()
                };
                
                // Trả về order với deliveryInfo đã được cập nhật
                return {
                  ...order,
                  deliveryInfo: updatedDeliveryInfo,
                  TrangThai: 'Đã giao hàng' // Cập nhật trạng thái đơn hàng nếu cần
                };
              }
              return order;
            })
          );
          
          // Refresh data từ server
          fetchOrders();
          fetchStats();
          
        } else {
          throw new Error(confirmData.message || 'Lỗi khi xác nhận giao hàng');
        }
        
      } catch (error) {
        console.error('❌ Lỗi xác nhận giao hàng:', error);
        toast.error(error instanceof Error ? error.message : 'Lỗi kết nối khi xác nhận giao hàng');
      } finally {
        setDeliveringOrder(null);
      }
    };
    
    input.click();
  };
  // Hàm upload ảnh lên server
  const uploadImageToServer = async (file: File): Promise<string> => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'delivery_proof');

      console.log('📤 Uploading image to server...', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Sử dụng API upload ảnh - cần thêm route cho API này
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Upload error:', errorData);
        
        // Fallback: Tạo URL tạm thời nếu API upload không hoạt động
        console.log('⚠️ Using temporary URL as fallback');
        return URL.createObjectURL(file);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Image uploaded successfully:', data.data);
        return data.data.imageUrl;
      } else {
        throw new Error(data.message || 'Upload failed');
      }

    } catch (error) {
      console.error('❌ Upload error:', error);
      // Fallback: Tạo URL tạm thời
      return URL.createObjectURL(file);
    }
  };

  const handleCancelDelivery = async (orderId: string, reason?: string): Promise<void> => {
    if (!reason) {
      const userReason = prompt('Vui lòng nhập lý do hủy giao hàng:');
      if (!userReason) return;
      reason = userReason;
    }
    
    try {
      setCancellingOrder(orderId);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Vui lòng đăng nhập lại');
        return;
      }

      const response = await fetch(`/api/shipper/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ LyDo: reason })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Đã hủy giao hàng thành công!');
        fetchOrders();
        fetchStats();
      } else {
        throw new Error(data.message || 'Lỗi khi hủy giao hàng');
      }
    } catch (error) {
      console.error('Lỗi hủy giao hàng:', error);
      toast.error(error instanceof Error ? error.message : 'Lỗi kết nối khi hủy giao hàng');
    } finally {
      setCancellingOrder(null);
    }
  };

  const handleSearch = () => {
    fetchOrders({
      keyword: searchKeyword,
      status: filterStatus !== "Tất cả" ? filterStatus : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });
  };

  const handleResetSearch = () => {
    setSearchKeyword("");
    setFilterStatus("Tất cả");
    setStartDate("");
    setEndDate("");
    fetchOrders();
  };

  const refreshAll = (): void => {
    fetchOrders();
    fetchStats();
    toast.success('Đã làm mới dữ liệu');
  };

  const availableOrders = orders.filter((order: Order) => 
    order.TrangThai === 'Chờ lấy hàng' && !order.deliveryInfo
  );

  const myOrders = orders.filter((order: Order) => 
    order.deliveryInfo && 
    ['ĐANG_CHỜ', 'ĐANG_GIAO', 'ĐÃ_GIAO'].includes(order.deliveryInfo.TrangThaiGiaoHang)
  );

  const displayStats = {
    total: stats.stats.total || 0,
    delivered: stats.stats.delivered || 0,
    delivering: stats.stats.delivering || 0,
    pending: stats.stats.pending || 0,
  };

  // Render các module khác nhau
  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Thống kê */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Tổng đơn hàng" 
                value={displayStats.total} 
                icon={<Package className="h-6 w-6" />}
                color="blue"
              />
              <StatCard 
                title="Đã giao" 
                value={displayStats.delivered} 
                icon={<Package className="h-6 w-6" />}
                color="green"
              />
              <StatCard 
                title="Đang giao" 
                value={displayStats.delivering} 
                icon={<Package className="h-6 w-6" />}
                color="orange"
              />
              <StatCard 
                title="Doanh thu tháng" 
                value={`${stats.monthlyRevenue?.toLocaleString('vi-VN') || 0} ₫`}
                icon={<BarChart3 className="h-6 w-6" />}
                color="purple"
              />
            </div>

            {/* Đơn hàng gần đây */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Đơn hàng gần đây</h2>
                <button 
                  onClick={() => setActiveModule('orders')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Xem tất cả →
                </button>
              </div>
              {orders.slice(0, 5).map((order) => (
                <OrderListItem key={order.MaDH} order={order} />
              ))}
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="space-y-6">
            {/* Thanh tìm kiếm và filter */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm mã đơn, địa chỉ..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="pl-10 w-full p-2 border rounded-lg"
                  />
                </div>                      
                <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Search className="h-4 w-4" />
                  Tìm kiếm
                </button>
              </div>
              </div>                         
            </div>

            {/* Tabs đơn hàng */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b">
                <nav className="flex -mb-px">
                  {['available', 'my_orders'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab === 'available' 
                        ? `Đơn hàng có sẵn (${availableOrders.length})` 
                        : `Đơn của tôi (${myOrders.length})`}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'available' && (
                  <OrderList
                    orders={availableOrders}
                    type="available"
                    onAccept={handleAcceptOrder}
                    loading={loading}
                    acceptingOrder={acceptingOrder}
                  />
                )}
                {activeTab === 'my_orders' && (
                  <OrderList
                    orders={myOrders}
                    type="my_orders"
                    onConfirmDelivery={handleConfirmDelivery}
                    onCancelDelivery={handleCancelDelivery}
                    loading={loading}
                    deliveringOrder={deliveringOrder}
                    cancellingOrder={cancellingOrder}
                    setPreviewImage={setPreviewImage}
                  />
                )}
              </div>
            </div>
          </div>
        );

      case 'stats':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Thống kê chi tiết</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Thống kê tổng quan */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Tổng quan</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <StatBox title="Tổng đơn" value={displayStats.total} />
                    <StatBox title="Đã giao" value={displayStats.delivered} />
                    <StatBox title="Đang giao" value={displayStats.delivering} />
                    <StatBox title="Doanh thu tháng" value={`${stats.monthlyRevenue?.toLocaleString('vi-VN') || 0} ₫`} />
                  </div>
                </div>

                {/* Thống kê theo tháng */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-700">Thống kê theo tháng</h3>
                    <button
                      onClick={() => fetchMonthlyStats(new Date().getFullYear())}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                  
                  {showMonthlyStats && monthlyStats.length > 0 ? (
                    <div className="space-y-2">
                      {monthlyStats.map((stat) => (
                        <div key={stat.month} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{stat.month}</span>
                            <span className="text-green-600 font-semibold">
                              {stat.totalRevenue.toLocaleString('vi-VN')} ₫
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {stat.totalOrders} đơn hàng
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      Chưa có dữ liệu thống kê theo tháng
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Thông tin cá nhân</h2>
              
              {shipperProfile ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Thông tin cơ bản */}
                  <div className="col-span-2 space-y-4">
                    <InfoRow label="Họ tên" value={shipperProfile.HoTen} />
                    <InfoRow label="Số điện thoại" value={shipperProfile.SDT} />
                    <InfoRow label="Email" value={shipperProfile.Email} />
                    <InfoRow label="Địa chỉ" value={shipperProfile.DiaChi} />
                    <InfoRow label="Ngày sinh" value={shipperProfile.NgaySinh ? new Date(shipperProfile.NgaySinh).toLocaleDateString('vi-VN') : 'Chưa cập nhật'} />
                    <InfoRow label="Giới tính" value={shipperProfile.GioiTinh || 'Chưa cập nhật'} />
                  </div>
                  
                  {/* Avatar và actions */}
                  <div className="space-y-4">
                    <div className="flex flex-col items-center">
                      <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-4">
                        {shipperProfile.AnhDaiDien ? (
                          <img 
                            src={shipperProfile.AnhDaiDien} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-16 w-16 text-gray-400" />
                        )}
                      </div>
                      <button
                        onClick={() => setShowProfileModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Chỉnh sửa thông tin
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                🚚 Trang Quản Lý Shipper
              </h1>
              {stats.shipperInfo.HoTen && (
                <p className="text-gray-600 mt-1">
                  Xin chào, <strong>{stats.shipperInfo.HoTen}</strong> - {stats.shipperInfo.SDT}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshAll}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '🔄 Đang tải...' : '🔄 Làm mới'}
              </button>
              
              {/* Thông báo */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100">
                <Bell className="h-6 w-6 text-gray-600" />
                {stats.unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {stats.unreadNotifications}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex border-t pt-4">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="h-5 w-5" /> },
              { id: 'orders', label: 'Đơn hàng', icon: <Package className="h-5 w-5" /> },
              { id: 'stats', label: 'Thống kê', icon: <BarChart3 className="h-5 w-5" /> },
              { id: 'profile', label: 'Hồ sơ', icon: <User className="h-5 w-5" /> }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg mx-1 ${
                  activeModule === item.id
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderModule()}
      </div>

      {/* Modal chỉnh sửa profile */}
      {showProfileModal && shipperProfile && (
        <ProfileModal 
          profile={shipperProfile}
          onUpdate={updateShipperProfile}
          onClose={() => setShowProfileModal(false)}
        />
      )}
      {previewImage && (
  <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-[60]">
    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b bg-gray-900 text-white">
        <div>
          <h3 className="text-lg font-semibold">
            Ảnh xác nhận giao hàng
          </h3>
          <p className="text-sm text-gray-300 mt-1">
            URL: <span className="font-mono text-xs">{previewImage}</span>
          </p>
        </div>
        <button
          onClick={() => setPreviewImage(null)}
          className="text-white hover:text-gray-300 text-2xl bg-gray-800 hover:bg-gray-700 w-10 h-10 rounded-full flex items-center justify-center"
        >
          ✕
        </button>
      </div>
      
      <div className="p-4 flex justify-center items-center h-[70vh] bg-black">
        <div className="relative w-full h-full">
          <img
            src={previewImage}
            alt="Proof of delivery"
            className="max-w-full max-h-full object-contain mx-auto"
            onError={(e) => {
              console.error('❌ Modal image load error:', previewImage);
              (e.target as HTMLImageElement).src = '/images/default-image.jpg';
              
              // Thử thêm base URL nếu là relative path
              if (!previewImage.startsWith('http') && !previewImage.startsWith('/')) {
                const correctedUrl = `${window.location.origin}/uploads/delivery_proofs/${previewImage}`;
                console.log('🔄 Trying corrected URL:', correctedUrl);
                (e.target as HTMLImageElement).src = correctedUrl;
              }
            }}
            onLoad={(e) => {
              console.log('✅ Modal image loaded successfully:', previewImage);
              console.log('Image dimensions:', {
                naturalWidth: e.currentTarget.naturalWidth,
                naturalHeight: e.currentTarget.naturalHeight
              });
            }}
          />
          
          {/* 🟢 LOADING INDICATOR */}
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50" id="image-loading">
            <div className="text-white">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p>Đang tải ảnh...</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-2 bg-gray-50">
        <div className="text-sm text-gray-600">
          Ảnh xác nhận giao hàng từ shipper • {new Date().toLocaleString('vi-VN')}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.href = previewImage;
              link.download = `delivery-proof-${Date.now()}.jpg`;
              link.target = '_blank';
              link.click();
            }}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
          >
            <span>💾</span>
            Tải xuống
          </button>
          <a
            href={previewImage}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
          >
            <span>🔗</span>
            Mở trong tab mới
          </a>
          <button
            onClick={() => setPreviewImage(null)}
            className="px-4 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
)}
 
    </div>
  );
};

// Component phụ
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const StatBox: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <p className="text-sm text-gray-600">{title}</p>
    <p className="text-lg font-semibold text-gray-900 mt-1">{value}</p>
  </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex border-b pb-2">
    <span className="w-1/3 font-medium text-gray-700">{label}:</span>
    <span className="w-2/3 text-gray-900">{value}</span>
  </div>
);

const OrderListItem: React.FC<{ order: Order }> = ({ order }) => {
  const getStatusColor = (order: Order): string => {
    if (order.deliveryInfo) {
      switch (order.deliveryInfo.TrangThaiGiaoHang) {
        case 'ĐANG_CHỜ': return 'bg-orange-100 text-orange-800';
        case 'ĐANG_GIAO': return 'bg-blue-100 text-blue-800';
        case 'ĐÃ_GIAO': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
    return 'bg-gray-100 text-gray-800';
  };
  const formatMoney = (amount: string | number | undefined): string => {
    if (!amount && amount !== 0) return '0 VNĐ';
    
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) return '0 VNĐ';
    
    // Format không có số thập phân nếu là số nguyên
    if (Number.isInteger(numAmount)) {
      return numAmount.toLocaleString('vi-VN') + ' VNĐ';
    }
    
    // Format có 2 số thập phân
    return numAmount.toLocaleString('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }) + ' VNĐ';
  };

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{order.MaDH}</span>
          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order)}`}>
            {order.deliveryInfo?.TrangThaiGiaoHang || order.TrangThai}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1">{order.DCNhanHang}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold">{formatMoney(order.TongTien)}</p>
        <p className="text-sm text-gray-600">{new Date(order.NgayTao || '').toLocaleDateString('vi-VN')}</p>
      </div>
    </div>
  );
};

interface OrderListProps {
  orders: Order[];
  type: string;
  onAccept?: (orderId: string) => void;
  onConfirmDelivery?: (orderId: string) => void;
  onCancelDelivery?: (orderId: string, reason?: string) => void;
  loading: boolean;
  acceptingOrder?: string | null;
  deliveringOrder?: string | null;
  cancellingOrder?: string | null;
  setPreviewImage?: (imageUrl: string) => void;
}

const OrderList: React.FC<OrderListProps> = ({ 
  orders, 
  type, 
  onAccept, 
  onConfirmDelivery, 
  onCancelDelivery,
  loading,
  acceptingOrder,
  deliveringOrder,
  cancellingOrder,
  setPreviewImage
}) => {
  const getStatusColor = (order: Order): string => {
    if (order.deliveryInfo) {
      switch (order.deliveryInfo.TrangThaiGiaoHang) {
        case 'ĐANG_CHỜ': return 'bg-orange-100 text-orange-800';
        case 'ĐANG_GIAO': return 'bg-blue-100 text-blue-800';
        case 'ĐÃ_GIAO': return 'bg-green-100 text-green-800';
        case 'ĐÃ_HỦY': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
    
    switch (order.TrangThai) {
      case 'Chờ lấy hàng': return 'bg-orange-100 text-orange-800';
      case 'Đang giao hàng': return 'bg-blue-100 text-blue-800';
      case 'Đã giao hàng': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (order: Order): string => {
    if (order.deliveryInfo) {
      switch (order.deliveryInfo.TrangThaiGiaoHang) {
        case 'ĐANG_CHỜ': return 'Chờ giao hàng';
        case 'ĐANG_GIAO': return 'Đang giao hàng';
        case 'ĐÃ_GIAO': return 'Đã giao hàng';
        case 'ĐÃ_HỦY': return 'Đã hủy';
        default: return order.TrangThai;
      }
    }
    return order.TrangThai;
  };

  const shouldShowDeliveryButton = (order: Order): boolean => {
    // Nếu có deliveryInfo và trạng thái là ĐANG_GIAO
    if (order.deliveryInfo?.TrangThaiGiaoHang === 'ĐANG_GIAO') {
      return true;
    }
    
    // Nếu không có deliveryInfo nhưng order.TrangThai là "Đang giao hàng"
    if (!order.deliveryInfo && order.TrangThai === 'Đang giao hàng') {
      return true;
    }
    
    // Nếu deliveryInfo tồn tại nhưng không có trạng thái rõ ràng
    if (order.deliveryInfo && 
        !['ĐÃ_GIAO', 'ĐÃ_HỦY'].includes(order.deliveryInfo.TrangThaiGiaoHang)) {
      return true;
    }
    
    return false;
  };

  const formatMoney = (amount: string | number | undefined): string => {
    if (!amount && amount !== 0) return '0 VNĐ';
    
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) return '0 VNĐ';
    
    // Format không có số thập phân nếu là số nguyên
    if (Number.isInteger(numAmount)) {
      return numAmount.toLocaleString('vi-VN') + ' VNĐ';
    }
    
    // Format có 2 số thập phân
    return numAmount.toLocaleString('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }) + ' VNĐ';
  };


  const shouldShowCancelButton = (order: Order): boolean => {
    return shouldShowDeliveryButton(order); // Hiển thị cùng điều kiện
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📦</div>
        <p className="text-gray-500 text-lg">
          {type === 'available' 
            ? 'Không có đơn hàng nào đang chờ lấy hàng' 
            : 'Bạn chưa nhận đơn hàng nào'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.MaDH} className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{order.MaDH}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order)}`}>
                  {getStatusText(order)}
                </span>
                {order.deliveryInfo?.MaGH && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                    Mã GH: {order.deliveryInfo.MaGH}
                  </span>
                )}
              </div>
              
              <div className="space-y-2 text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{order.DCNhanHang}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{order.MaTK_taikhoan?.HoTen} - {order.MaTK_taikhoan?.SDT}</span>
                </div>
                {order.MaCH_cuahang && (
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span>Cửa hàng: {order.MaCH_cuahang.TenCH} - {order.MaCH_cuahang.SDT}</span>
                  </div>
                )}
                {order.NgayTao && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(order.NgayTao).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-right ml-6">
              <div className="text-xl font-bold text-blue-600 mb-2">
                {formatMoney(order.TongTien)}
              </div>
              {order.PhiVanChuyen > 0 && (
                <div className="text-sm text-gray-600 mb-4">
                  Phí vận chuyển: {formatMoney(order.TongTien)} 
                </div>
              )}
              
              <div className="space-y-2">
                {type === 'available' && onAccept && (
                  <button
                    onClick={() => onAccept(order.MaDH)}
                    disabled={!!acceptingOrder}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {acceptingOrder === order.MaDH ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Đang nhận...
                      </>
                    ) : (
                      <>
                        <Package className="h-4 w-4" />
                        Nhận đơn
                      </>
                    )}
                  </button>
                )}
                
                {type === 'my_orders' && (
                  <div className="flex flex-col gap-2 min-w-[180px]">
                    
                    {/* 🟢 NÚT GIAO HÀNG THÀNH CÔNG - SỬ DỤNG HÀM KIỂM TRA MỚI */}
                    {shouldShowDeliveryButton(order) && (
                      <>
                        <button
                          onClick={() => onConfirmDelivery?.(order.MaDH)}
                          disabled={deliveringOrder === order.MaDH}
                          className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {deliveringOrder === order.MaDH ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Đang xử lý...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Giao hàng thành công
                            </>
                          )}
                        </button>
                        
                        {/* 🟢 NÚT HỦY GIAO HÀNG */}
                        {shouldShowCancelButton(order) && (
                          <button
                            onClick={() => onCancelDelivery?.(order.MaDH)}
                            disabled={cancellingOrder === order.MaDH}
                            className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cancellingOrder === order.MaDH ? 'Đang hủy...' : 'Hủy giao hàng'}
                          </button>
                        )}
                      </>
                    )}
                    
                    {/* 🟢 HIỂN THỊ TRẠNG THÁI CHỜ GIAO
                    {order.deliveryInfo?.TrangThaiGiaoHang === 'ĐANG_CHỜ' && (
                      <div className="px-4 py-2.5 bg-orange-50 text-orange-800 border border-orange-200 rounded-lg text-center text-sm font-medium">
                        ⏳ Đang chờ lấy hàng
                      </div>
                    )} */}
                    
                    {/* 🟢 HIỂN THỊ KHI ĐÃ HỦY */}
                    {order.deliveryInfo?.TrangThaiGiaoHang === 'ĐÃ_HỦY' && (
                      <div className="px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-center text-sm font-medium">
                        ❌ Đã hủy giao hàng
                      </div>
                    )}
                    
                    {/* 🟢 HIỂN THỊ KHI ĐÃ GIAO HÀNG */}
                    {order.deliveryInfo?.TrangThaiGiaoHang === 'ĐÃ_GIAO' && (
                      <div className="space-y-2">
                        <div className="flex flex-col gap-1">
                          <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium inline-flex items-center justify-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            ✅ Đã giao hàng
                          </span>
                          
                          {/* HIỂN THỊ NGÀY GIAO */}
                          {order.deliveryInfo?.NgayTaoGiaoHang && (
                            <span className="text-xs text-gray-500 text-center">
                              {new Date(order.deliveryInfo.NgayTaoGiaoHang).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>
                        
                        {/* NÚT XEM ẢNH XÁC NHẬN */}
                        {order.deliveryInfo?.ProofImage && (
                          <button
                            onClick={() => setPreviewImage?.(order.deliveryInfo!.ProofImage!)}
                            className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center gap-2 w-full justify-center"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Xem ảnh xác nhận
                          </button>
                        )}
                        
                        {/* GHI CHÚ */}
                        {order.deliveryInfo?.GhiChu && (
                          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                            <span className="font-medium">Ghi chú:</span> {order.deliveryInfo.GhiChu}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* 🟢 HIỂN THỊ CHO TRƯỜNG HỢP KHÁC */}
                    {!order.deliveryInfo && !['Đang giao hàng', 'Đã giao hàng'].includes(order.TrangThai) && (
                      <div className="px-4 py-2.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-center text-sm font-medium">
                        {order.TrangThai || 'Chưa xác định'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

interface ProfileModalProps {
  profile: ShipperProfile;
  onUpdate: (updatedProfile: Partial<ShipperProfile>) => Promise<void>;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ profile, onUpdate, onClose }) => {
  const [formData, setFormData] = useState<Partial<ShipperProfile>>(profile);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdate(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Chỉnh sửa thông tin</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ tên
              </label>
              <input
                type="text"
                value={formData.HoTen || ''}
                onChange={(e) => setFormData({...formData, HoTen: e.target.value})}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={formData.SDT || ''}
                onChange={(e) => setFormData({...formData, SDT: e.target.value})}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.Email || ''}
                onChange={(e) => setFormData({...formData, Email: e.target.value})}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ
              </label>
              <textarea
                value={formData.DiaChi || ''}
                onChange={(e) => setFormData({...formData, DiaChi: e.target.value})}
                className="w-full p-2 border rounded-lg"
                rows={3}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
        
      </div>
      
    </div>
  );
};

export default ShipperDashboard;