// src/pages/BlockchainDashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext'; 
import { blockchainAPI, apiClient } from '@/services/blockchainApi';
import './BlockchainDashboard.css';

interface UserEvent {
  productId: string;
  status?: string;
  eventType?: string;
  timestamp: number | string;
  location?: string;
  blockIndex?: number;
  notes?: string;
  imageUrl?: string | null;
  qrCode?: string | null;
  [key: string]: any;
}

interface NewBlockData {
  productId: string;
  eventType: string;
  location: string;
  quantity?: number | null;
  quality?: string | null;
  price?: number | null;
  batchNumber?: string | null;
  fromLocation?: string | null;
  toLocation?: string | null;
  seedType?: string | null;
  area?: number | null;
  yield?: number | null;
  waterSource?: string | null;
  fertilizerType?: string | null;
  harvestDate?: string | null;
  saleDate?: string | null;
  notes?: string | null;
  duration?: number | null;
  temperature?: number | null;
  customerType?: string | null;

}

interface QRModalData {
  qrCode: string;
  productId: string;
  blockIndex: number;
  blockHash: string;
  totalBlocks?: number;
  qrUrl?: string;
}

interface EventType {
  value: string;
  label: string;
}
// Event types theo role
const EVENT_TYPES_BY_ROLE : Record<string, EventType[]> = {
  'Farmer': [
    { value: 'planting', label: 'Trồng cây' },
    { value: 'fertilizing', label: 'Bón phân' },
    { value: 'watering', label: 'Tưới nước' },
    { value: 'harvesting', label: 'Thu hoạch' },
    { value: 'quality_check', label: 'Kiểm tra chất lượng' }
  ],
  'Shipper': [
    { value: 'pickup', label: 'Lấy hàng' },
    { value: 'intransit', label: 'Đang vận chuyển' },
    { value: 'warehouse', label: 'Nhập kho' },
    { value: 'delivered', label: 'Đã giao hàng' },
    { value: 'delay', label: 'Trì hoãn' }
  ],
  'Factory': [
    { value: 'cleaning', label: 'Làm sạch' },
    { value: 'sorting', label: 'Phân loại' },
    { value: 'roasting', label: 'Rang xay' },
    { value: 'grinding', label: 'Xay nghiền' },
    { value: 'packaging', label: 'Đóng gói' },
    { value: 'quality_control', label: 'Kiểm soát chất lượng' }
  ],
  'CuaHang': [
    { value: 'received', label: 'Nhập hàng' },
    { value: 'sale', label: 'Bán hàng' },
    { value: 'display', label: 'Trưng bày' },
    { value: 'promotion', label: 'Khuyến mãi' }
  ],
  'Customer': [
    { value: 'purchase', label: 'Mua hàng' },
    { value: 'review', label: 'Đánh giá' },
    { value: 'return', label: 'Trả hàng' }
  ]
};

const BlockchainDashboard: React.FC = () => {
  const { user: authUser, loading, getUserRoles } = useAuth();
  const [activeSection, setActiveSection] = useState<'form' | 'history'>('form');
  const [blockchainStats, setBlockchainStats] = useState<any>(null);
  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [qrModal, setQrModal] = useState<QRModalData | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  const [form, setForm] = useState<NewBlockData>({
    productId: '',
    eventType: '',
    location: '',
    quantity: null,
    quality: null,
    price: null,
    batchNumber: null,
    fromLocation: null,
    toLocation: null,
    seedType: null,
    area: null,
    yield: null,
    waterSource: null,
    fertilizerType: null,
    harvestDate: null,
    saleDate: null,
    notes: '',
    duration: null,
    temperature: null,
    customerType: null
  });

  const roles = getUserRoles();
  const displayRole = roles[0];

  const [agree, setAgree] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Lấy event types theo role của user
  const getEventTypesForCurrentUser = () => {
  if (!authUser) return [];
  
  // Map role từ database sang key trong EVENT_TYPES_BY_ROLE
  const roleMapping: Record<string, string> = {
    'Factory': 'Factory',        // DB: Factory → Map: Factory
    'Farmer': 'Farmer',          // DB: Farmer → Map: Farmer  
    'Cửa Hàng': 'CuaHang',       // DB: Cửa Hàng → Map: CuaHang
    'Shipper': 'Shipper',        // DB: Shipper → Map: Shipper
    'Khách Hàng': 'Customer',    // DB: Khách Hàng → Map: Customer
    'Admin': 'Farmer'            // Admin có thể xem được của Farmer
  };
  
  const dbRole = authUser.role; // Lấy role trực tiếp từ authUser
  const mappedRole = roleMapping[dbRole];
  
  console.log('🔍 Role mapping:', { 
    dbRole, 
    mappedRole, 
    available: mappedRole ? EVENT_TYPES_BY_ROLE[mappedRole]?.length || 0 : 0 
  });
  
  return mappedRole ? EVENT_TYPES_BY_ROLE[mappedRole as keyof typeof EVENT_TYPES_BY_ROLE] || [] : [];
};

  useEffect(() => {
    if (loading) return;
    loadStats();
    if (authUser) {
      loadUserEvents(authUser.TenDangNhap);
    }
  }, [authUser, loading]); 

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const res = await blockchainAPI.getBlockchainStats();
      if (res.success) setBlockchainStats(res.data);
    } catch (err: any) {
      console.error('Error loading stats', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadUserEvents = async (username?: string) => {
    try {
      setEventsLoading(true);
      const user = username || authUser?.TenDangNhap;
      if (!user) return;
      
      const res = await blockchainAPI.getUserEvents(user, 50);
      
      if (res && (res.success || res.data)) {
        const data = res.data || [];
        const normalized: UserEvent[] = data.map((it: any) => ({
          ...it,
          timestamp: (typeof it.timestamp === 'number' || typeof it.timestamp === 'string') ? it.timestamp : Date.now()
        }));
        setUserEvents(normalized);
      } else {
        setUserEvents([]);
      }
    } catch (err: any) {
      console.error('Error loading user events', err);
      setUserEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const removeImage = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFormChange = (key: keyof NewBlockData, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const resetForm = (keepProductId = false) => {
    setForm({
      productId: keepProductId ? form.productId : '',
      eventType: '',
      location: '',
      quantity: null,
      quality: null,
      price: null,
      batchNumber: null,
      fromLocation: null,
      toLocation: null,
      seedType: null,
      area: null,
      yield: null,
      waterSource: null,
      fertilizerType: null,
      harvestDate: null,
      saleDate: null,
      notes: '',
      duration: null,
      temperature: null,
      customerType: null
    });
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setAgree(false);
  };

  const validateForm = (): string | null => {
    if (!form.productId?.trim()) return 'Vui lòng nhập Mã sản phẩm';
    if (!form.eventType?.trim()) return 'Vui lòng chọn Loại sự kiện';
    if (!form.location?.trim()) return 'Vui lòng nhập Địa điểm';
    if (!agree) return 'Bạn phải đồng ý lưu dữ liệu lên blockchain';
    return null;
  };

  const submitEventForm = async () => {
  const error = validateForm();
  if (error) {
    alert(error);
    return;
  }

  if (!authUser) {
    alert('Vui lòng đăng nhập để ghi dữ liệu');
    window.location.href = '/signin';
    return;
  }

  setSubmitting(true);

  try {
    // Upload image if exists - SỬA LẠI HOÀN TOÀN
        let imageUrl: string | null = null;
        if (file) {
          try {
            console.log('🖼️ Đang upload ảnh...');
            const uploadRes = await blockchainAPI.uploadImage(file);
            console.log('📊 Upload result:', uploadRes);
            
            // SỬA: Kiểm tra đúng cách và tránh truy cập property không tồn tại theo kiểu tường minh
            // uploadRes có thể có cấu trúc ApiResponse với data.imageUrl, hoặc một object trực tiếp chứa imageUrl
            if (uploadRes && (uploadRes as any).success) {
              imageUrl = uploadRes.data?.imageUrl ?? (uploadRes as any).imageUrl ?? (uploadRes as any).data?.url ?? null;
              console.log('✅ Upload thành công, imageUrl:', imageUrl);
            } else {
              console.warn('⚠️ Upload không thành công:', (uploadRes as any).message || 'Unknown upload error');
            }
          } catch (uploadErr: any) {
            console.error('❌ Upload image error:', uploadErr);
            console.log('📌 Tiếp tục không có ảnh...');
            // Tiếp tục mà không có ảnh
          }
        } else {
          console.log('📷 Không có ảnh để upload');
        }

    // Prepare payload
    const payload: any = {
      productId: form.productId,
      eventType: form.eventType,
      location: form.location,
      notes: form.notes,
      quantity: form.quantity,
      quality: form.quality,
      price: form.price,
      batchNumber: form.batchNumber,
      fromLocation: form.fromLocation,
      toLocation: form.toLocation,
      seedType: form.seedType,
      area: form.area,
      yield: form.yield,
      waterSource: form.waterSource,
      fertilizerType: form.fertilizerType,
      harvestDate: form.harvestDate,
      saleDate: form.saleDate,
      duration: form.duration,
      temperature: form.temperature,
      customerType: form.customerType,
      imageUrl: imageUrl,
      actor: authUser.TenDangNhap,
      role: authUser.role,
      timestamp: new Date().toISOString()
    };

    console.log('📤 Gửi payload đến blockchain:', payload);

    const res = await blockchainAPI.recordTransaction(payload);
    if (!res.success) {
      throw new Error(res.message || 'Ghi blockchain thất bại');
    }

    // Show success
    setSuccessData(res.data || res);
    await loadStats();
    await loadUserEvents(authUser.TenDangNhap);
    resetForm(true);

    // Auto remove success message
    setTimeout(() => setSuccessData(null), 8000);

  } catch (err: any) {
    console.error('❌ Lỗi submit:', err);
    alert('❌ Lỗi: ' + (err.message || String(err)));
  } finally {
    setSubmitting(false);
  }
};

  const showBlockchainStats = async () => {
    try {
      const res = await blockchainAPI.getBlockchainStats();
      if (res.success) {
        const stats = res.data;
        const validText = stats.isValid ? '✅ Hợp lệ' : '❌ Không hợp lệ';
        alert(`📊 THỐNG KÊ BLOCKCHAIN\n\nTổng số Block: ${stats.totalBlocks}\nGiao dịch: ${stats.totalTransactions}\nTrạng thái: ${validText}`);
      }
    } catch (err: any) {
      alert('❌ Lỗi: ' + (err.message || 'Không thể lấy thống kê'));
    }
  };

  const validateBlockchain = async () => {
    if (!confirm('🔍 Xác thực blockchain sẽ kiểm tra tính toàn vẹn. Tiếp tục?')) return;
    
    try {
      const res = await blockchainAPI.validateChain();
      if (res.success) {
        const icon = res.data.isValid ? '✅' : '❌';
        alert(`${icon} ${res.data.message}\n\nTổng số block: ${res.data.stats.totalBlocks}`);
      }
    } catch (err: any) {
      alert('❌ Lỗi xác thực: ' + (err.message || 'Không thể xác thực'));
    }
  };

  const generateQRCode = async (productId: string) => {
  try {
    console.log(`📱 Đang tạo QR code cho sản phẩm: ${productId}`);
    
    // CHỈ GỌI MỘT ENDPOINT DUY NHẤT
    const res = await apiClient.get(`/qrcode/${productId}`);

    console.log('📊 QR code response:', res.data);
    
    if (res.data.success && res.data.qrCode) {
      console.log('✅ QR code tạo thành công');
      
      setQrModal({
        qrCode: res.data.qrCode,
        productId: productId,
        blockIndex: res.data.blockCount || 0,
        blockHash: res.data.blockCount ? `Sản phẩm có ${res.data.blockCount} blocks` : 'Quét mã để xem chi tiết',
        totalBlocks: res.data.blockCount,
        qrUrl: res.data.url
      });
    } else {
      alert('❌ Không thể tạo QR code: ' + (res.data.message || 'Lỗi không xác định'));
    }
  } catch (err: any) {
    console.error('❌ Lỗi tạo QR code:', err);
    const errorMessage = err.response?.data?.message || err.message || 'Lỗi kết nối server';
    alert(`❌ Không thể tạo QR code: ${errorMessage}`);
  }
};

  // THÊM: Hàm tạo QR code cho block cụ thể (nếu cần)
  const generateBlockQRCode = async (productId: string, blockIndex: number, blockHash?: string) => {
    try {
      console.log(`📱 Đang tạo QR code cho block: #${blockIndex}, sản phẩm: ${productId}`);
      
      const res = await blockchainAPI.generateBlockQRCode(productId, blockIndex, blockHash);
      
      if (res.success && res.data) {
        console.log('✅ Block QR code tạo thành công');
        
        setQrModal({
          qrCode: res.data.qrCode,
          productId: res.data.productId,
          blockIndex: res.data.blockIndex,
          blockHash: res.data.blockHash || `Block #${res.data.blockIndex}`
        });
      } else {
        alert('❌ Không thể tạo QR code cho block: ' + (res.message || 'Lỗi không xác định'));
      }
    } catch (err: any) {
      console.error('❌ Lỗi tạo block QR code:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi kết nối server';
      alert(`❌ Không thể tạo QR code cho block: ${errorMessage}`);
    }
  };

  const downloadQRCode = () => {
    if (!qrModal) {
      console.warn('⚠️ Không có QR code để tải xuống');
      return;
    }
    
    try {
      console.log(`💾 Đang tải xuống QR code cho: ${qrModal.productId}`);
      
      const link = document.createElement('a');
      link.href = qrModal.qrCode;
      
      // Tạo tên file an toàn hơn
      const safeFileName = qrModal.productId
        .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/g, '_') // Thay thế ký tự đặc biệt
        .replace(/_+/g, '_') // Loại bỏ nhiều _ liên tiếp
        .substring(0, 50); // Giới hạn độ dài
      
      link.download = `QR_${safeFileName}_${Date.now()}.png`;
      
      // Thêm sự kiện để xử lý sau khi tải
      link.addEventListener('click', () => {
        setTimeout(() => {
          console.log('✅ QR code đã được tải xuống');
        }, 100);
      });
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error('❌ Lỗi tải xuống QR code:', err);
      alert('❌ Lỗi tải xuống QR code');
    }
  };

  // THÊM: Hàm mở QR code trong tab mới
  const openQRCodeInNewTab = () => {
    if (!qrModal) return;
    
    try {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>QR Code - ${qrModal.productId}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px;
                background: #f5f5f5;
              }
              .qr-container { 
                background: white; 
                padding: 20px; 
                border-radius: 10px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                display: inline-block;
                margin-top: 50px;
              }
              .product-info { 
                margin-bottom: 20px; 
                color: #333;
              }
              .qr-image { 
                max-width: 300px; 
                border: 2px solid #1a237e;
                border-radius: 5px;
              }
              .download-btn {
                margin-top: 15px;
                padding: 10px 20px;
                background: #1a237e;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="product-info">
                <h2>📱 Mã QR Sản Phẩm</h2>
                <p><strong>Mã sản phẩm:</strong> ${qrModal.productId}</p>
                <p><strong>Block:</strong> #${qrModal.blockIndex}</p>
              </div>
              <img src="${qrModal.qrCode}" alt="QR Code" class="qr-image" />
              <br>
              <button class="download-btn" onclick="window.print()">🖨️ In QR Code</button>
            </div>
          </body>
          </html>
        `);
        newWindow.document.close();
      }
    } catch (err) {
      console.error('❌ Lỗi mở QR code:', err);
      alert('❌ Không thể mở QR code trong tab mới');
    }
  };

  // CẬP NHẬT PHẦN JSX - Thêm nút mở trong tab mới
  {/* Trong phần QR Modal */}
  {qrModal && (
  <div className="qr-modal show" onClick={() => setQrModal(null)}>
    <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
      <h2>📱 Mã QR Sản Phẩm</h2>
      <div className="qr-product-info">
        <p><strong>Mã sản phẩm:</strong> {qrModal.productId}</p>
        <p><strong>Tổng số blocks:</strong> {qrModal.totalBlocks || 'Đang tải...'}</p>
        <p><strong>Block mới nhất:</strong> #{qrModal.blockIndex}</p>
        <p><strong>URL khi quét:</strong> 
          <br />
          <code style={{ fontSize: '10px', wordBreak: 'break-all' }}>
            {qrModal.qrUrl || 'Quét mã để xem chi tiết'}
          </code>
        </p>
      </div>
      <img src={qrModal.qrCode} alt="QR Code" className="qr-image" />
      <p className="qr-note">
        📸 Quét mã QR bằng điện thoại (cùng mạng WiFi) 
        <br />
        để xem toàn bộ lịch sử sản phẩm
      </p>
      <div className="qr-buttons">
        <button className="qr-download-btn" onClick={downloadQRCode}>
          💾 Tải xuống QR
        </button>
        <button className="qr-open-btn" onClick={openQRCodeInNewTab}>
          🔍 Mở toàn màn hình
        </button>
        <button className="qr-close-btn" onClick={() => setQrModal(null)}>
          Đóng
        </button>
      </div>
    </div>
  </div>
)}

  const getRoleIcon = (role: string) => {
    const icons: { [key: string]: string } = {
      'Farmer': '🌾',
      'Shipper': '🚚', 
      'Factory': '🏭',
      'CuaHang': '🏪',
      'Customer': '👤'
    };
    return icons[role] || '👤';
  };

  const getRoleName = (role: string) => {
    const names: { [key: string]: string } = {
      'Farmer': 'Nông dân',
      'Shipper': 'Vận chuyển',
      'Factory': 'Nhà máy', 
      'CuaHang': 'Cửa hàng',
      'Customer': 'Khách hàng'
    };
    return names[role] || role;
  };

  const eventName = (et?: string) => {
    const map: { [key: string]: string } = {
      'planting': 'Trồng cây',
      'fertilizing': 'Bón phân',
      'watering': 'Tưới nước',
      'harvesting': 'Thu hoạch',
      'quality_check': 'Kiểm tra chất lượng',
      'pickup': 'Lấy hàng',
      'intransit': 'Đang vận chuyển',
      'warehouse': 'Nhập kho',
      'delivered': 'Đã giao hàng',
      'delay': 'Trì hoãn',
      'cleaning': 'Làm sạch',
      'sorting': 'Phân loại',
      'roasting': 'Rang xay',
      'grinding': 'Xay nghiền',
      'packaging': 'Đóng gói',
      'quality_control': 'Kiểm soát chất lượng',
      'received': 'Nhập hàng',
      'sale': 'Bán hàng',
      'display': 'Trưng bày',
      'promotion': 'Khuyến mãi',
      'purchase': 'Mua hàng',
      'review': 'Đánh giá',
      'return': 'Trả hàng'
    };
    return map[et ?? ''] ?? et ?? '';
  };

  // Hiển thị các trường động theo vai trò và loại sự kiện
  const renderDynamicFields = () => {
    if (!authUser) return null;

    const dbRole  = authUser.role;
    const eventType = form.eventType;

    const roleMapping: Record<string, string> = {
      'Factory': 'Factory',
      'Farmer': 'Farmer', 
      'Cửa Hàng': 'CuaHang',
      'Shipper': 'Shipper',
      'Khách Hàng': 'Customer',
      'Admin': 'Farmer'
    };

    const mappedRole = roleMapping[dbRole];

    // 🧑‍🌾 NÔNG DÂN (Farmer)
    if (mappedRole === 'Farmer') {
      switch (eventType) {
        case 'planting':
          return (
            <>
              <div className="form-group">
                <label>Ngày trồng *</label>
                <input
                  type="date"
                  value={form.harvestDate || ''}
                  onChange={(e) => handleFormChange('harvestDate', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Loại giống *</label>
                <input
                  type="text"
                  value={form.seedType || ''}
                  onChange={(e) => handleFormChange('seedType', e.target.value)}
                  placeholder="VD: Giống cà chua MN2"
                  required
                />
              </div>
              <div className="form-group">
                <label>Diện tích (m²)</label>
                <input
                  type="number"
                  value={form.area || ''}
                  onChange={(e) => handleFormChange('area', Number(e.target.value))}
                  min="0"
                />
              </div>
            </>
          );

        case 'fertilizing':
          return (
            <>
              <div className="form-group">
                <label>Loại phân bón *</label>
                <input
                  type="text"
                  value={form.fertilizerType || ''}
                  onChange={(e) => handleFormChange('fertilizerType', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Ghi chú</label>
                <textarea
                  value={form.notes || ''}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  placeholder="Thời gian, liều lượng, ghi chú thêm..."
                />
              </div>
            </>
          );

        case 'watering':
          return (
            <>
              <div className="form-group">
                <label>Nguồn nước *</label>
                <input
                  type="text"
                  value={form.waterSource || ''}
                  onChange={(e) => handleFormChange('waterSource', e.target.value)}
                  placeholder="Giếng khoan, nước sông..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Ghi chú</label>
                <textarea
                  value={form.notes || ''}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                />
              </div>
            </>
          );

        case 'harvesting':
          return (
            <>
              <div className="form-group">
                <label>Ngày thu hoạch *</label>
                <input
                  type="date"
                  value={form.harvestDate || ''}
                  onChange={(e) => handleFormChange('harvestDate', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Sản lượng (kg) *</label>
                <input
                  type="number"
                  value={form.quantity || ''}
                  onChange={(e) => handleFormChange('quantity', Number(e.target.value))}
                  min="0"
                  required
                />
              </div>
            </>
          );

        case 'quality_check':
          return (
            <>
              <div className="form-group">
                <label>Phân loại chất lượng *</label>
                <select
                  value={form.quality || ''}
                  onChange={(e) => handleFormChange('quality', e.target.value)}
                  required
                >
                  <option value="">-- Chọn loại --</option>
                  <option value="A">Loại A</option>
                  <option value="B">Loại B</option>
                  <option value="C">Loại C</option>
                </select>
              </div>
              <div className="form-group">
                <label>Ghi chú</label>
                <textarea
                  value={form.notes || ''}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                />
              </div>
            </>
          );
      }
    }

    // 🏭 NHÀ MÁY (Factory)
    if (mappedRole  === 'Factory') {
      switch (eventType) {
        case 'cleaning':
        case 'sorting':
        case 'roasting':
        case 'grinding':
          return (
            <>
              <div className="form-group">
                <label>Thời gian xử lý (giờ)</label>
                <input
                  type="number"
                  value={form.duration || ''}
                  onChange={(e) => handleFormChange('duration', Number(e.target.value))}
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Ghi chú</label>
                <textarea
                  value={form.notes || ''}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                />
              </div>
            </>
          );

        case 'packaging':
          return (
            <>
              <div className="form-group">
                <label>Mã lô hàng *</label>
                <input
                  type="text"
                  value={form.batchNumber || ''}
                  onChange={(e) => handleFormChange('batchNumber', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Số lượng đóng gói *</label>
                <input
                  type="number"
                  value={form.quantity || ''}
                  onChange={(e) => handleFormChange('quantity', Number(e.target.value))}
                  min="0"
                  required
                />
              </div>
            </>
          );

        case 'quality_control':
          return (
            <>
              <div className="form-group">
                <label>Kết quả kiểm soát chất lượng *</label>
                <select
                  value={form.quality || ''}
                  onChange={(e) => handleFormChange('quality', e.target.value)}
                  required
                >
                  <option value="">-- Chọn kết quả --</option>
                  <option value="Pass">Đạt</option>
                  <option value="Fail">Không đạt</option>
                </select>
              </div>
            </>
          );
      }
    }

    // 🚚 VẬN CHUYỂN (Shipper)
    if (mappedRole  === 'Shipper') {
      switch (eventType) {
        case 'pickup':
        case 'intransit':
        case 'warehouse':
        case 'delivered':
        case 'delay':
          return (
            <>
              <div className="form-group">
                <label>Điểm đi *</label>
                <input
                  type="text"
                  value={form.fromLocation || ''}
                  onChange={(e) => handleFormChange('fromLocation', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Điểm đến *</label>
                <input
                  type="text"
                  value={form.toLocation || ''}
                  onChange={(e) => handleFormChange('toLocation', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nhiệt độ vận chuyển (°C)</label>
                <input
                  type="number"
                  value={form.temperature || ''}
                  onChange={(e) => handleFormChange('temperature', Number(e.target.value))}
                  step="0.1"
                />
              </div>
            </>
          );
      }
    }

    // 🏪 CỬA HÀNG (CuaHang)
    if (mappedRole  === 'Cửa Hàng' || mappedRole  === 'CuaHang') {
      switch (eventType) {
        case 'received':
          return (
            <>
              <div className="form-group">
                <label>Ngày nhập hàng *</label>
                <input
                  type="date"
                  value={form.saleDate || ''}
                  onChange={(e) => handleFormChange('saleDate', e.target.value)}
                  required
                />
              </div>
            </>
          );

        case 'sale':
          return (
            <>
              <div className="form-group">
                <label>Ngày bán *</label>
                <input
                  type="date"
                  value={form.saleDate || ''}
                  onChange={(e) => handleFormChange('saleDate', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Giá bán (VNĐ)</label>
                <input
                  type="number"
                  value={form.price || ''}
                  onChange={(e) => handleFormChange('price', Number(e.target.value))}
                  min="0"
                />
              </div>
            </>
          );

        case 'display':
          return (
            <>
              <div className="form-group">
                <label>Kệ trưng bày *</label>
                <input
                  type="text"
                  value={form.location || ''}
                  onChange={(e) => handleFormChange('location', e.target.value)}
                  required
                />
              </div>
            </>
          );

        case 'promotion':
          return (
            <>
              <div className="form-group">
                <label>Ghi chú khuyến mãi</label>
                <textarea
                  value={form.notes || ''}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  placeholder="Thông tin về chương trình khuyến mãi"
                />
              </div>
            </>
          );
      }
    }

    // 👤 KHÁCH HÀNG (Customer)
    if (mappedRole  === 'Customer') {
      switch (eventType) {
        case 'purchase':
          return (
            <>
              <div className="form-group">
                <label>Ngày mua *</label>
                <input
                  type="date"
                  value={form.saleDate || ''}
                  onChange={(e) => handleFormChange('saleDate', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Loại khách hàng</label>
                <input
                  type="text"
                  value={form.customerType || ''}
                  onChange={(e) => handleFormChange('customerType', e.target.value)}
                  placeholder="Cá nhân / Doanh nghiệp..."
                />
              </div>
            </>
          );

        case 'review':
          return (
            <>
              <div className="form-group">
                <label>Đánh giá *</label>
                <select
                  value={form.quality || ''}
                  onChange={(e) => handleFormChange('quality', e.target.value)}
                  required
                >
                  <option value="">-- Chọn đánh giá --</option>
                  <option value="5">★★★★★ Rất tốt</option>
                  <option value="4">★★★★ Tốt</option>
                  <option value="3">★★★ Trung bình</option>
                  <option value="2">★★ Kém</option>
                  <option value="1">★ Rất tệ</option>
                </select>
              </div>
              <div className="form-group">
                <label>Nhận xét</label>
                <textarea
                  value={form.notes || ''}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  placeholder="Nhận xét của bạn..."
                />
              </div>
            </>
          );

        case 'return':
          return (
            <>
              <div className="form-group">
                <label>Lý do trả hàng *</label>
                <textarea
                  value={form.notes || ''}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  required
                />
              </div>
            </>
          );
      }
    }

    return null;
  };


  if (loading) {
    return (
      <div className="loading-full">
        <div>Đang tải...</div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="dashboard-container">
        <div className="navbar">
          <h1>📦 Supply Chain Blockchain</h1>
          <div className="user-info">
            <span className="user-role">🔒 Vui lòng đăng nhập</span>
            <button className="nav-home" onClick={() => window.location.href = '/'}>🏠 Trang chủ</button>
            <button className="nav-login" onClick={() => window.location.href = '/signin'}>🔐 Đăng nhập</button>
          </div>
        </div>
        <div className="container">
          <div className="login-prompt">
            <h2>🔐 Vui lòng đăng nhập</h2>
            <p>Bạn cần đăng nhập để sử dụng tính năng Blockchain Dashboard</p>
            <button onClick={() => window.location.href = '/signin'} className="submit-btn">
              Đăng nhập ngay
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentEventTypes = getEventTypesForCurrentUser();

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <div className="navbar">
        <h1>📦 Supply Chain Blockchain</h1>
        <div className="user-info">
          <span className="user-role">{getRoleIcon(displayRole)} {getRoleName(displayRole)}</span>
          <span className="user-name">👤 {authUser.TenDangNhap}</span>
          <button className="nav-home" onClick={() => window.location.href = '/'}>🏠 Trang chủ</button>
        </div>
      </div>

      <div className="container">
        {/* Navigation Buttons */}
        <div className="nav-buttons">
          <button 
            className={`nav-btn ${activeSection === 'form' ? 'active' : ''}`}
            onClick={() => setActiveSection('form')}
          >
            📝 Nhập liệu
          </button>
          <button 
            className={`nav-btn ${activeSection === 'history' ? 'active' : ''}`}
            onClick={() => setActiveSection('history')}
          >
            📋 Lịch sử
          </button>
          <button className="nav-btn" onClick={showBlockchainStats}>
            📊 Thống kê Blockchain
          </button>
          <button className="nav-btn" onClick={validateBlockchain}>
            🔍 Kiểm tra tính hợp lệ
          </button>
        </div>

        {/* Success Message */}
        {successData && (
          <div className="message success">
            <h3>✅ {successData.message || 'Sự kiện đã được ghi thành công!'}</h3>
            <div className="success-grid">
              {/* Sử dụng nested data từ API response */}
              <div><strong>Sự kiện:</strong> {eventName(successData.transaction?.eventType) || eventName(successData.eventType) || 'Không xác định'}</div>
              <div><strong>Mã SP:</strong> {successData.transaction?.productId || successData.productId}</div>
              <div><strong>Địa điểm:</strong> {successData.transaction?.location || successData.location}</div>
              <div><strong>Người thực hiện:</strong> {successData.transaction?.actor || successData.actor} ({getRoleName(successData.transaction?.role || successData.role)})</div>
              {/* <div><strong>Thời gian:</strong> {new Date(successData.transaction?.timestamp || successData.timestamp).toLocaleString('vi-VN')}</div>
              <div><strong>Block:</strong> #{successData.block?.index || successData.blockIndex}</div>
              <div><strong>Hash:</strong> {successData.block?.hash?.substring(0, 20) || successData.transactionHash?.substring(0, 20)}...</div> */}
            </div>
            {successData.transaction?.notes && <div><strong>Ghi chú:</strong> {successData.transaction.notes}</div>}
          </div>
        )}

        {/* Main Content */}
        {activeSection === 'form' ? (
          <div className="input-section">
            <h2>{getRoleIcon(displayRole)} Ghi nhận thông tin {getRoleName(displayRole)}</h2>
            
            {/* User Info & Stats */}
            <div className="user-stats">
              <div className="user-details">
                <div className="user-name-display">
                  <strong>{getRoleIcon(displayRole)} {authUser.TenDangNhap}</strong>
                </div>
                <div className="user-role-display">{getRoleName(displayRole)}</div>
              </div>
              <div className="stats-display">
                {statsLoading ? (
                  <div>Đang tải thống kê...</div>
                ) : blockchainStats ? (
                  <>
                    <div>Tổng Blocks: <strong>{blockchainStats.totalBlocks}</strong></div>
                    <div>Giao dịch: <strong>{blockchainStats.totalTransactions}</strong></div>
                  </>
                ) : null}
              </div>
            </div>

            {/* Dynamic Form */}
            <form onSubmit={(e) => { e.preventDefault(); submitEventForm(); }}>
              <div className="form-grid">
                {/* Common Fields */}
                <div className="form-group">
                  <label htmlFor="productId">Mã sản phẩm *</label>
                  <input
                    type="text"
                    id="productId"
                    value={form.productId}
                    onChange={(e) => handleFormChange('productId', e.target.value)}
                    placeholder="VD: CAFE-001"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location">Địa điểm *</label>
                  <input
                    type="text"
                    id="location"
                    value={form.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    placeholder="Nhập địa điểm hiện tại"
                    required
                  />
                </div>

                {/* Event Type - CHỈ HIỆN EVENT THEO ROLE */}
                <div className="form-group">
                  <label htmlFor="eventType">Loại sự kiện *</label>
                  <select
                    id="eventType"
                    value={form.eventType}
                    onChange={(e) => handleFormChange('eventType', e.target.value)}
                    required
                  >
                    <option value="">-- Chọn sự kiện --</option>
                    {currentEventTypes.map((event) => (
                      <option key={event.value} value={event.value}>
                        {event.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Fields theo role và event type */}
                {form.eventType && (
                  <div className="dynamic-fields">
                    {renderDynamicFields()}
                  </div>
                )}

                {/* Common Optional Fields */}
                <div className="form-group">
                  <label htmlFor="quality">Chất lượng</label>
                  <select
                    id="quality"
                    value={form.quality || ''}
                    onChange={(e) => handleFormChange('quality', e.target.value)}
                  >
                    <option value="">-- Chọn --</option>
                    <option value="A">Loại A - Cao cấp</option>
                    <option value="B">Loại B - Tiêu chuẩn</option>
                    <option value="C">Loại C - Thường</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="notes">Ghi chú chi tiết</label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={form.notes || ''}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Mô tả chi tiết sự kiện..."
                  />
                </div>

                {/* Image Upload */}
                <div className="form-group full-width">
                  <label htmlFor="imageUpload">Hình ảnh minh chứng (tùy chọn)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    onChange={onFileChange}
                  />
                  {preview && (
                    <div className="image-preview">
                      <img src={preview} alt="Preview" />
                      <button type="button" onClick={removeImage} className="remove-image-btn">
                        ❌ Xóa ảnh
                      </button>
                    </div>
                  )}
                </div>

                {/* Agreement */}
                <div className="form-group full-width agreement">
                  <label className="agreement-label">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                      required
                    />
                    ✅ Tôi đồng ý ghi dữ liệu này lên blockchain - dữ liệu sẽ không thể thay đổi sau khi ghi
                  </label>
                </div>

                {/* Submit Button */}
                <div className="form-group full-width">
                  <button type="submit" className="submit-btn" disabled={submitting}>
                    {submitting ? '⏳ Đang ghi...' : '🔐 Ký & Ghi lên Blockchain'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          /* History Section */
          <div className="history-section">
            <h2>📋 Lịch sử cập nhật của bạn</h2>
            
            {eventsLoading ? (
              <div className="loading">⏳ Đang tải lịch sử...</div>
            ) : userEvents.length === 0 ? (
              <div className="empty-message">ℹ️ Chưa có lịch sử cập nhật nào.</div>
            ) : (
              <div className="timeline">
                {userEvents.map((event, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-content">
                      <div className="timeline-status">
                        <strong>📅 Sự kiện:</strong> {eventName(event.eventType) || event.status || 'Không xác định'}
                      </div>
                      <div className="timeline-info">
                        <strong>👤 Người thực hiện:</strong> {event.actor} {getRoleName(event.role)}
                      </div>
                      <div className="timeline-info">
                        <strong>🕒 Thời gian:</strong> {new Date(Number(event.timestamp)).toLocaleString('vi-VN')}
                      </div>
                      <div className="timeline-info">
                        <strong>📦 Sản phẩm:</strong> {event.productId}
                      </div>
                      <div className="timeline-info">
                        <strong>📍 Địa điểm:</strong> {event.location}
                      </div>
                      <div className="timeline-info">
                        <strong>🔗 Block:</strong> #{event.blockIndex || 'N/A'}
                      </div>
                      {event.imageUrl && (
                        <div className="timeline-info">
                          <strong>📸 Ảnh:</strong>
                          <img 
                            src={event.imageUrl} 
                            alt="Evidence" 
                            className="event-image"
                            onClick={() => window.open(event.imageUrl!, '_blank')}
                          />
                        </div>
                      )}
                      {event.notes && (
                        <div className="timeline-info">
                          <strong>📝 Ghi chú:</strong> {event.notes}
                        </div>
                      )}
                    </div>
                    <div className="timeline-qr">
                      <button 
                        className="qr-btn"
                        onClick={() => generateQRCode(event.productId)}
                      >
                        📱 Xem QR
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* QR Modal */}
      {qrModal && (
      <div className="qr-modal show" onClick={() => setQrModal(null)}>
        <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
          <h2>📱 Mã QR Sản Phẩm</h2>
          <div className="qr-product-info">
            <p><strong>Mã sản phẩm:</strong> {qrModal.productId}</p>
            <p><strong>Tổng số blocks:</strong> {qrModal.totalBlocks || 'Đang tải...'}</p>
            <p><strong>Block mới nhất:</strong> #{qrModal.blockIndex}</p>
            <p><strong>URL khi quét:</strong> 
              <br />
              <code style={{ fontSize: '10px', wordBreak: 'break-all' }}>
                {qrModal.qrUrl || 'Quét mã để xem chi tiết'}
              </code>
            </p>
          </div>
          <img src={qrModal.qrCode} alt="QR Code" className="qr-image" />
          <p className="qr-note">
            📸 Quét mã QR bằng điện thoại (cùng mạng WiFi) 
            <br />
            để xem toàn bộ lịch sử sản phẩm
          </p>
          <div className="qr-buttons">
            <button className="qr-download-btn" onClick={downloadQRCode}>
              💾 Tải xuống QR
            </button>
            <button className="qr-open-btn" onClick={openQRCodeInNewTab}>
              🔍 Mở toàn màn hình
            </button>
            <button className="qr-close-btn" onClick={() => setQrModal(null)}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default BlockchainDashboard;