import React, { useState, useEffect, useContext } from 'react';
import type { KhuyenMai, CreateKhuyenMaiData } from '@/services/khuyenmaiApi';
import { khuyenMaiAPI } from '@/services/khuyenmaiApi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext'; // ← Sử dụng useAuth hook

const QuanLyKhuyenMaiPage: React.FC = () => {
  const [khuyenMaiList, setKhuyenMaiList] = useState<KhuyenMai[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingKhuyenMai, setEditingKhuyenMai] = useState<KhuyenMai | null>(null);
  const [accessDenied, setAccessDenied] = useState<boolean>(false);
  
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading, hasRole } = useAuth(); // ← Sử dụng useAuth

  // Form state
  const [formData, setFormData] = useState<CreateKhuyenMaiData>({
    TenKM: '',
    MoTa: '',
    LoaiKM: 'PRODUCT',
    GiaTriGiam: 0,
    HinhThucGiam: 'PERCENT',
    DieuKien: 0,
    SoTienGiamToiDa: 0,
    NgayBatDau: '',
    NgayKetThuc: '',
    GioiHanSuDung: 100
  });

  // Kiểm tra quyền truy cập
  const checkPermission = (): boolean => {
    if (!isAuthenticated() || !user) {
      console.log("❌ Chưa đăng nhập hoặc không có user");
      return false;
    }
    
    const hasPermission = hasRole(['Admin', 'Cửa Hàng', 'Người Bán']);
    
    console.log("🔐 Kiểm tra quyền:", {
      role: user.roles || user.role,
      MaCH: user.MaCH,
      hasPermission: hasPermission
    });
    
    return hasPermission;
  };

  const loadKhuyenMai = async (): Promise<void> => {
    if (!user) return;
    
    try {
      setLoading(true);

      console.log("🔄 Đang tải khuyến mãi - User info:", { 
        roles: user.roles || user.role, 
        MaTK: user.MaTK,
        fullUser: user 
      });

      if (hasRole('Admin')) {
        const response = await khuyenMaiAPI.getAllKhuyenMai();
        setKhuyenMaiList(response.data);
      } else if (hasRole(['Cửa Hàng', 'Người Bán'])) {
        const response = await khuyenMaiAPI.getKhuyenMaiByCuaHang();
        setKhuyenMaiList(response.data);
      }
    } catch (err: any) {
      console.error('Error loading promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Đợi auth loading xong
    if (authLoading) {
      console.log("⏳ Auth đang loading...");
      return;
    }

    console.log("🔍 Kiểm tra quyền:", {
      user: user,
      isAuthenticated: isAuthenticated(),
      roles: user?.roles || user?.role,
      MaCH: user?.MaCH
    });

    // Kiểm tra quyền khi component mount
    if (!checkPermission()) {
      console.log("❌ Không có quyền truy cập");
      setAccessDenied(true);
      return;
    }
    
    console.log("✅ Có quyền truy cập");
    
    if (user) {
      loadKhuyenMai();
    }
  }, [user, authLoading, hasRole]);

  const handleCreateKhuyenMai = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!user) return;
    
    try {
      await khuyenMaiAPI.createKhuyenMai(formData);
      alert('Tạo khuyến mãi thành công!');
      setShowForm(false);
      resetForm();
      loadKhuyenMai();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleUpdateKhuyenMai = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!editingKhuyenMai || !user) return;
    
    try {
      await khuyenMaiAPI.updateKhuyenMai(editingKhuyenMai.MaKM, formData);
      alert('Cập nhật khuyến mãi thành công!');
      setEditingKhuyenMai(null);
      setShowForm(false);
      resetForm();
      loadKhuyenMai();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteKhuyenMai = async (MaKM: string): Promise<void> => {
    if (!confirm('Bạn có chắc muốn xóa khuyến mãi này?')) return;
    
    try {
      await khuyenMaiAPI.deleteKhuyenMai(MaKM);
      alert('Xóa khuyến mãi thành công!');
      loadKhuyenMai();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const resetForm = (): void => {
    setFormData({
      TenKM: '',
      MoTa: '',
      LoaiKM: 'PRODUCT',
      GiaTriGiam: 0,
      HinhThucGiam: 'PERCENT',
      DieuKien: 0,
      SoTienGiamToiDa: 0,
      NgayBatDau: '',
      NgayKetThuc: '',
      GioiHanSuDung: 100
    });
  };

  const openEditForm = (khuyenMai: KhuyenMai): void => {
    // Kiểm tra quyền sửa: Admin hoặc chính cửa hàng sở hữu
    // Lưu ý: user từ AuthContext có field TenDangNhap thay vì username
    if (user?.role !== 'Admin' && khuyenMai.MaCH !== user?.MaCH) {
      alert('Bạn không có quyền sửa khuyến mãi này');
      return;
    }
    
    setEditingKhuyenMai(khuyenMai);
    setFormData({
      TenKM: khuyenMai.TenKM,
      MoTa: khuyenMai.MoTa,
      LoaiKM: khuyenMai.LoaiKM,
      GiaTriGiam: khuyenMai.GiaTriGiam,
      HinhThucGiam: khuyenMai.HinhThucGiam,
      DieuKien: khuyenMai.DieuKien,
      SoTienGiamToiDa: khuyenMai.SoTienGiamToiDa,
      NgayBatDau: khuyenMai.NgayBatDau.split('T')[0],
      NgayKetThuc: khuyenMai.NgayKetThuc.split('T')[0],
      GioiHanSuDung: khuyenMai.GioiHanSuDung
    });
    setShowForm(true);
  };

  const closeForm = (): void => {
    setShowForm(false);
    setEditingKhuyenMai(null);
    resetForm();
  };

  // Helper functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getLoaiKMLabel = (loaiKM: string): string => {
    const labels: { [key: string]: string } = {
      'SHIPPING': 'Giảm giá vận chuyển',
      'FREESHIP': 'Miễn phí vận chuyển',
      'CATEGORY': 'Giảm giá theo danh mục',
      'ALL': 'Giảm giá toàn bộ',
      'PRODUCT': 'Giảm giá sản phẩm'
    };
    return labels[loaiKM] || loaiKM;
  };

  // CSS Styles
  const pageStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    minHeight: '80vh'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '15px',
    borderBottom: '2px solid #e0e0e0',
  };

  const titleStyle: React.CSSProperties = {
    color: '#e74c3c',
    margin: 0,
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  };

  const accessDeniedStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '50px 20px',
    color: '#e74c3c',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  };

  const thStyle: React.CSSProperties = {
    backgroundColor: '#34495e',
    color: 'white',
    padding: '12px',
    textAlign: 'left',
    fontWeight: 'bold',
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px',
    borderBottom: '1px solid #ecf0f1',
  };

  const actionButtonStyle: React.CSSProperties = {
    padding: '6px 12px',
    margin: '0 4px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
  };

  const formStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    zIndex: 1000,
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  };

  const inputGroupStyle: React.CSSProperties = {
    marginBottom: '15px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#2c3e50',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    fontSize: '14px',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    backgroundColor: 'white',
  };

  const formButtonStyle: React.CSSProperties = {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '10px',
    fontWeight: 'bold',
  };

  // Hiển thị loading khi auth đang tải
  if (authLoading) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Đang xác thực...</p>
        </div>
      </div>
    );
  }

  // Hiển thị trang truy cập bị từ chối
  if (accessDenied) {
    return (
      <div style={pageStyle}>
        <div style={accessDeniedStyle}>
          <h2 style={{ color: '#e74c3c' }}>⛔ Truy Cập Bị Từ Chối</h2>
          <p>Bạn không có quyền truy cập trang quản lý khuyến mãi.</p>
          <p>Chỉ <strong>Admin</strong> và <strong>Cửa Hàng</strong> mới được phép truy cập.</p>
          <p>Vai trò hiện tại của bạn: <strong>{user?.role || 'Không xác định'}</strong></p>
          <button 
            style={{ ...buttonStyle, backgroundColor: '#3498db', marginTop: '20px' }}
            onClick={() => navigate('/khuyen-mai')}
          >
            Quay lại trang khuyến mãi
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Đang tải dữ liệu khuyến mãi...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>
            {user?.role === 'Admin' ? 'Quản Lý Khuyến Mãi' : 'Khuyến Mãi Của Tôi'}
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            Xin chào, {user?.HoTen || user?.TenDangNhap} ({user?.role})
          </p>
        </div>
        <button 
          style={buttonStyle}
          onClick={() => setShowForm(true)}
        >
          + Tạo Khuyến Mãi Mới
        </button>
      </div>

      {/* Bảng danh sách khuyến mãi */}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Tên KM</th>
            <th style={thStyle}>Loại</th>
            <th style={thStyle}>Giá trị</th>
            <th style={thStyle}>Ngày bắt đầu</th>
            <th style={thStyle}>Ngày kết thúc</th>
            {user?.role === 'Admin' && <th style={thStyle}>Cửa hàng</th>}
            <th style={thStyle}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {khuyenMaiList.map((khuyenMai) => (
            <tr key={khuyenMai.MaKM}>
              <td style={tdStyle}>
                <strong>{khuyenMai.TenKM}</strong>
                <br />
                <small style={{ color: '#666' }}>{khuyenMai.MoTa}</small>
              </td>
              <td style={tdStyle}>{getLoaiKMLabel(khuyenMai.LoaiKM)}</td>
              <td style={tdStyle}>
                {khuyenMai.HinhThucGiam === 'PERCENT' 
                  ? `${khuyenMai.GiaTriGiam}%`
                  : formatCurrency(khuyenMai.GiaTriGiam)
                }
              </td>
              <td style={tdStyle}>{new Date(khuyenMai.NgayBatDau).toLocaleDateString('vi-VN')}</td>
              <td style={tdStyle}>{new Date(khuyenMai.NgayKetThuc).toLocaleDateString('vi-VN')}</td>
              {user?.role === 'Admin' && (
                <td style={tdStyle}>
                  {khuyenMai.MaCH ? `CH${khuyenMai.MaCH}` : 'Admin'}
                </td>
              )}
              <td style={tdStyle}>
                <button
                  style={{ 
                    ...actionButtonStyle, 
                    backgroundColor: '#3498db', 
                    color: 'white',
                    opacity: (user?.role !== 'Admin' && khuyenMai.MaCH !== user?.MaCH) ? 0.5 : 1
                  }}
                  onClick={() => openEditForm(khuyenMai)}
                  disabled={user?.role !== 'Admin' && khuyenMai.MaCH !== user?.MaCH}
                >
                  Sửa
                </button>
                <button
                  style={{ 
                    ...actionButtonStyle, 
                    backgroundColor: '#e74c3c', 
                    color: 'white',
                    opacity: (user?.role !== 'Admin' && khuyenMai.MaCH !== user?.MaCH) ? 0.5 : 1
                  }}
                  onClick={() => handleDeleteKhuyenMai(khuyenMai.MaKM)}
                  disabled={user?.role !== 'Admin' && khuyenMai.MaCH !== user?.MaCH}
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {khuyenMaiList.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>Chưa có khuyến mãi nào</p>
        </div>
      )}

      {/* Form tạo/sửa khuyến mãi */}
      {showForm && (
        <>
          <div style={overlayStyle} onClick={closeForm}></div>
          <div style={formStyle}>
            <h2 style={{ marginTop: 0, color: '#2c3e50' }}>
              {editingKhuyenMai ? 'Chỉnh sửa Khuyến Mãi' : 'Tạo Khuyến Mãi Mới'}
            </h2>
            
            <form onSubmit={editingKhuyenMai ? handleUpdateKhuyenMai : handleCreateKhuyenMai}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Tên khuyến mãi *</label>
                <input
                  type="text"
                  value={formData.TenKM}
                  onChange={(e) => setFormData({ ...formData, TenKM: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Mô tả</label>
                <textarea
                  value={formData.MoTa}
                  onChange={(e) => setFormData({ ...formData, MoTa: e.target.value })}
                  style={{ ...inputStyle, minHeight: '80px' }}
                />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Loại khuyến mãi *</label>
                <select
                  value={formData.LoaiKM}
                  onChange={(e) => setFormData({ ...formData, LoaiKM: e.target.value })}
                  style={selectStyle}
                  required
                >
                  {user?.role === 'Cửa Hàng' ? (
                    <option value="PRODUCT">Giảm giá sản phẩm</option>
                  ) : (
                    <>
                      <option value="PRODUCT">Giảm giá sản phẩm</option>
                      <option value="SHIPPING">Giảm giá vận chuyển</option>
                      <option value="FREESHIP">Miễn phí vận chuyển</option>
                      <option value="CATEGORY">Giảm giá theo danh mục</option>
                      <option value="ALL">Giảm giá toàn bộ</option>
                    </>
                  )}
                </select>
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Hình thức giảm giá *</label>
                <select
                  value={formData.HinhThucGiam}
                  onChange={(e) => setFormData({ ...formData, HinhThucGiam: e.target.value })}
                  style={selectStyle}
                  required
                >
                  <option value="PERCENT">Theo phần trăm (%)</option>
                  <option value="AMOUNT">Theo số tiền (VND)</option>
                </select>
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>
                  {formData.HinhThucGiam === 'PERCENT' ? 'Phần trăm giảm (%) *' : 'Số tiền giảm (VND) *'}
                </label>
                <input
                  type="number"
                  value={formData.GiaTriGiam}
                  onChange={(e) => setFormData({ ...formData, GiaTriGiam: Number(e.target.value) })}
                  style={inputStyle}
                  min="0"
                  max={formData.HinhThucGiam === 'PERCENT' ? 100 : undefined}
                  required
                />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Điều kiện áp dụng (VND)</label>
                <input
                  type="number"
                  value={formData.DieuKien}
                  onChange={(e) => setFormData({ ...formData, DieuKien: Number(e.target.value) })}
                  style={inputStyle}
                  min="0"
                />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Giảm tối đa (VND)</label>
                <input
                  type="number"
                  value={formData.SoTienGiamToiDa}
                  onChange={(e) => setFormData({ ...formData, SoTienGiamToiDa: Number(e.target.value) })}
                  style={inputStyle}
                  min="0"
                />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Ngày bắt đầu *</label>
                <input
                  type="date"
                  value={formData.NgayBatDau}
                  onChange={(e) => setFormData({ ...formData, NgayBatDau: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Ngày kết thúc *</label>
                <input
                  type="date"
                  value={formData.NgayKetThuc}
                  onChange={(e) => setFormData({ ...formData, NgayKetThuc: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Giới hạn sử dụng</label>
                <input
                  type="number"
                  value={formData.GioiHanSuDung}
                  onChange={(e) => setFormData({ ...formData, GioiHanSuDung: Number(e.target.value) })}
                  style={inputStyle}
                  min="1"
                />
              </div>

              <div style={{ marginTop: '25px', textAlign: 'right' }}>
                <button
                  type="button"
                  style={{ ...formButtonStyle, backgroundColor: '#95a5a6', color: 'white' }}
                  onClick={closeForm}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ ...formButtonStyle, backgroundColor: '#27ae60', color: 'white' }}
                >
                  {editingKhuyenMai ? 'Cập nhật' : 'Tạo'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default QuanLyKhuyenMaiPage;