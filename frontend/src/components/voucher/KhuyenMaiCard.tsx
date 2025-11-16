import React, { useState } from 'react'; // ✅ THÊM useState
import type { KhuyenMai } from '../../services/khuyenmaiApi';
import { khuyenMaiAPI } from '../../services/khuyenmaiApi';

interface KhuyenMaiCardProps {
  khuyenMai: KhuyenMai;
  isReceived: boolean;
  onReceive: (MaKM: string) => void;
}

const KhuyenMaiCard: React.FC<KhuyenMaiCardProps> = ({ 
  khuyenMai, 
  isReceived, 
  onReceive 
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false); // ✅ THÊM LOADING STATE

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

  const getHinhThucGiamLabel = (hinhThuc: string): string => {
    return hinhThuc === 'PERCENT' ? 'Giảm theo %' : 'Giảm trực tiếp';
  };

  const handleNhanKhuyenMai = async (e: React.MouseEvent): Promise<void> => {
  e.stopPropagation(); // ✅ NGĂN EVENT BUBBLING
  e.preventDefault(); // ✅ NGĂN DEFAULT BEHAVIOR
  
  if (isLoading) return;
  
  setIsLoading(true);
  console.log("🟡 BẮT ĐẦU - Nhận khuyến mãi:", khuyenMai.MaKM);
  
  try {
    const response = await khuyenMaiAPI.nhanKhuyenMai(khuyenMai.MaKM);
    console.log("🟢 THÀNH CÔNG - API response:", response.data);
    
    // ✅ CẬP NHẬT STATE NGAY SAU KHI API THÀNH CÔNG
    onReceive(khuyenMai.MaKM);
    console.log("🟢 Đã gọi onReceive với MaKM:", khuyenMai.MaKM);
    
    alert('Nhận khuyến mãi thành công!');
    
  } catch (error: any) {
    console.log("🔴 LỖI:", error.response?.data);
    
    const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra';
    
    // ✅ NẾU LỖI "ĐÃ NHẬN", CẬP NHẬT STATE NHƯNG KHÔNG ALERT LỖI
    if (error.response?.status === 400 && errorMessage.includes("đã nhận")) {
      console.log("🟡 Phát hiện lỗi 'đã nhận' - cập nhật UI");
      onReceive(khuyenMai.MaKM);
      // ❌ KHÔNG alert() Ở ĐÂY - chỉ cập nhật UI thôi
    } else {
      alert(errorMessage); // ✅ Chỉ alert với lỗi khác
    }
  } finally {
    setIsLoading(false);
  }
};

  const cardStyle: React.CSSProperties = {
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '20px',
    background: 'white',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  };

  const cardHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
  };

  const badgeStyle = (isAdmin: boolean): React.CSSProperties => ({
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.8em',
    fontWeight: 'bold',
    background: isAdmin ? '#3498db' : '#9b59b6',
    color: 'white',
  });

  const discountValueStyle: React.CSSProperties = {
    color: '#e74c3c',
    fontSize: '1.1em',
  };

  // ✅ SỬA BUTTON STYLE - THÊM TRẠNG THÁI LOADING
  const buttonStyle = (isReceived: boolean, isLoading: boolean): React.CSSProperties => ({
    background: isReceived ? '#27ae60' : (isLoading ? '#95a5a6' : '#e74c3c'),
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: (isReceived || isLoading) ? 'not-allowed' : 'pointer',
    fontWeight: 'bold',
    width: '100%',
    transition: 'background 0.2s',
    opacity: (isReceived || isLoading) ? 0.7 : 1,
  });

  return (
    <div 
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 5px 20px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
      }}
    >
      <div style={cardHeaderStyle}>
        <h3 style={{ margin: 0, color: '#2c3e50', flex: 1, marginRight: '10px' }}>
          {khuyenMai.TenKM}
        </h3>
        <span style={badgeStyle(!khuyenMai.MaCH)}>
          {khuyenMai.MaCH ? 'Cửa hàng' : 'Admin'}
        </span>
      </div>
      
      <div>
        <p style={{ color: '#666', marginBottom: '15px', lineHeight: '1.4' }}>
          {khuyenMai.MoTa}
        </p>
        
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', padding: '4px 0' }}>
            <span>Loại:</span>
            <strong>{getLoaiKMLabel(khuyenMai.LoaiKM)}</strong>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', padding: '4px 0' }}>
            <span>Hình thức:</span>
            <strong>{getHinhThucGiamLabel(khuyenMai.HinhThucGiam)}</strong>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', padding: '4px 0' }}>
            <span>Giá trị:</span>
            <strong style={discountValueStyle}>
              {khuyenMai.HinhThucGiam === 'PERCENT' 
                ? `${khuyenMai.GiaTriGiam}%`
                : formatCurrency(khuyenMai.GiaTriGiam)
              }
            </strong>
          </div>
          
          {khuyenMai.SoTienGiamToiDa && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', padding: '4px 0' }}>
              <span>Giảm tối đa:</span>
              <strong>{formatCurrency(khuyenMai.SoTienGiamToiDa)}</strong>
            </div>
          )}
          
          {khuyenMai.DieuKien && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', padding: '4px 0' }}>
              <span>Điều kiện:</span>
              <span>Đơn tối thiểu {formatCurrency(khuyenMai.DieuKien)}</span>
            </div>
          )}
        </div>
        
        <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '6px', fontSize: '0.9em', color: '#666' }}>
          <div>Ngày bắt đầu: {new Date(khuyenMai.NgayBatDau).toLocaleDateString('vi-VN')}</div>
          <div>Ngày kết thúc: {new Date(khuyenMai.NgayKetThuc).toLocaleDateString('vi-VN')}</div>
        </div>
      </div>
      
      <div style={{ marginTop: '15px', textAlign: 'center' }}>
        {!isReceived ? (
          <button 
            style={buttonStyle(false, isLoading)}
            onClick={(e) => handleNhanKhuyenMai(e)}
            disabled={isLoading} // ✅ VÔ HIỆU HÓA KHI LOADING
            onMouseEnter={(e) => {
              if (!isReceived && !isLoading) e.currentTarget.style.background = '#c0392b';
            }}
            onMouseLeave={(e) => {
              if (!isReceived && !isLoading) e.currentTarget.style.background = '#e74c3c';
            }}
          >
            {isLoading ? 'Đang nhận...' : 'Nhận Ngay'} {/* ✅ HIỂN THỊ TRẠNG THÁI */}
          </button>
        ) : (
          <button style={buttonStyle(true, false)} disabled>
            Đã Nhận
          </button>
        )}
      </div>
    </div>
  );
};

export default KhuyenMaiCard;