// src/pages/BlockchainDashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext'; // ← THÊM LẠI
import { blockchainAPI } from '@/services/blockchainApi';
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
}

// Event types theo role
const EVENT_TYPES_BY_ROLE = {
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
  const { user: authUser, loading } = useAuth(); // ← THÊM LẠI
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

  const [agree, setAgree] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lấy event types theo role của user
  const getEventTypesForCurrentUser = () => {
    if (!authUser) return [];
    const userRole = authUser.role;
    return EVENT_TYPES_BY_ROLE[userRole as keyof typeof EVENT_TYPES_BY_ROLE] || [];
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
      const res = await blockchainAPI.generateQRCode(productId);
      if (res.success) {
        setQrModal({
          qrCode: res.data.qrCode,
          productId: productId,
          blockIndex: res.data.blockCount || 0,
          blockHash: 'Quét mã để xem chi tiết'
        });
      }
    } catch (err) {
      alert('❌ Không thể tạo QR code');
    }
  };

  const downloadQRCode = () => {
    if (!qrModal) return;
    const link = document.createElement('a');
    link.href = qrModal.qrCode;
    link.download = `QR_${qrModal.productId.replace(/\s+/g, '_')}.png`;
    link.click();
  };

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

  // Hiển thị dynamic fields theo role và event type
  const renderDynamicFields = () => {
    if (!authUser) return null;
    
    const userRole = authUser.role;
    const eventType = form.eventType;

    if (userRole === 'Farmer') {
      switch (eventType) {
        case 'planting':
          return (
            <>
              <div className="form-group">
                <label htmlFor="harvestDate">Ngày trồng *</label>
                <input
                  type="date"
                  id="harvestDate"
                  value={form.harvestDate || ''}
                  onChange={(e) => handleFormChange('harvestDate', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="seedType">Loại giống *</label>
                <input
                  type="text"
                  id="seedType"
                  value={form.seedType || ''}
                  onChange={(e) => handleFormChange('seedType', e.target.value)}
                  placeholder="Loại giống sử dụng"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="area">Diện tích (m²) *</label>
                <input
                  type="number"
                  id="area"
                  value={form.area || ''}
                  onChange={(e) => handleFormChange('area', Number(e.target.value))}
                  min="0"
                  step="0.1"
                  required
                />
              </div>
            </>
          );
        case 'harvesting':
          return (
            <>
              <div className="form-group">
                <label htmlFor="harvestDate">Ngày thu hoạch *</label>
                <input
                  type="date"
                  id="harvestDate"
                  value={form.harvestDate || ''}
                  onChange={(e) => handleFormChange('harvestDate', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="quantity">Số lượng thu hoạch (kg) *</label>
                <input
                  type="number"
                  id="quantity"
                  value={form.quantity || ''}
                  onChange={(e) => handleFormChange('quantity', Number(e.target.value))}
                  min="0"
                  step="0.1"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="yield">Năng suất (kg/m²)</label>
                <input
                  type="number"
                  id="yield"
                  value={form.yield || ''}
                  onChange={(e) => handleFormChange('yield', Number(e.target.value))}
                  min="0"
                  step="0.1"
                />
              </div>
            </>
          );
        // Thêm các case khác cho Farmer...
      }
    }

    if (userRole === 'Shipper') {
      switch (eventType) {
        case 'pickup':
        case 'delivered':
          return (
            <>
              <div className="form-group">
                <label htmlFor="fromLocation">Điểm đi *</label>
                <input
                  type="text"
                  id="fromLocation"
                  value={form.fromLocation || ''}
                  onChange={(e) => handleFormChange('fromLocation', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="toLocation">Điểm đến *</label>
                <input
                  type="text"
                  id="toLocation"
                  value={form.toLocation || ''}
                  onChange={(e) => handleFormChange('toLocation', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="temperature">Nhiệt độ vận chuyển (°C)</label>
                <input
                  type="number"
                  id="temperature"
                  value={form.temperature || ''}
                  onChange={(e) => handleFormChange('temperature', Number(e.target.value))}
                  step="0.1"
                />
              </div>
            </>
          );
      }
    }

    // Thêm các role khác...

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
          <span className="user-role">{getRoleIcon(authUser.role)} {getRoleName(authUser.role)}</span>
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
            <h3>✅ Sự kiện đã được ghi thành công!</h3>
            <div className="success-grid">
              <div><strong>Sự kiện:</strong> {eventName(successData.eventType)}</div>
              <div><strong>Mã SP:</strong> {successData.productId}</div>
              <div><strong>Địa điểm:</strong> {successData.location}</div>
              <div><strong>Người thực hiện:</strong> {successData.actor} ({getRoleName(successData.role)})</div>
              <div><strong>Thời gian:</strong> {new Date(successData.timestamp).toLocaleString('vi-VN')}</div>
              <div><strong>Block:</strong> #{successData.blockIndex}</div>
              <div><strong>Hash:</strong> {successData.transactionHash?.substring(0, 20)}...</div>
            </div>
            {successData.notes && <div><strong>Ghi chú:</strong> {successData.notes}</div>}
          </div>
        )}

        {/* Main Content */}
        {activeSection === 'form' ? (
          <div className="input-section">
            <h2>{getRoleIcon(authUser.role)} Ghi nhận thông tin {getRoleName(authUser.role)}</h2>
            
            {/* User Info & Stats */}
            <div className="user-stats">
              <div className="user-details">
                <div className="user-name-display">
                  <strong>{getRoleIcon(authUser.role)} {authUser.TenDangNhap}</strong>
                </div>
                <div className="user-role-display">{getRoleName(authUser.role)}</div>
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
                      <div className="timeline-status">{eventName(event.eventType) || event.status || 'Sự kiện'}</div>
                      <div className="timeline-info">
                        <strong>👤 Người thực hiện:</strong> {event.actor} ({getRoleName(event.role)})
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
              <p><strong>Block:</strong> #{qrModal.blockIndex}</p>
              <p><strong>Hash:</strong> <code>{qrModal.blockHash}</code></p>
            </div>
            <img src={qrModal.qrCode} alt="QR Code" className="qr-image" />
            <p className="qr-note">📸 Quét mã QR này để xem lịch sử sản phẩm</p>
            <div className="qr-buttons">
              <button className="qr-download-btn" onClick={downloadQRCode}>
                💾 Tải xuống QR
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