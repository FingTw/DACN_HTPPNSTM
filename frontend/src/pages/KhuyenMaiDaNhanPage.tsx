import React, { useState, useEffect } from 'react';
import type { KhuyenMaiDaNhan } from '@/services/khuyenmaiApi';
import { khuyenMaiAPI } from '@/services/khuyenmaiApi';
import { useAuth } from '@/context/AuthContext';

const KhuyenMaiDaNhanPage: React.FC = () => {
  const [khuyenMaiDaNhan, setKhuyenMaiDaNhan] = useState<KhuyenMaiDaNhan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const { isAuthenticated } = useAuth();

  const loadKhuyenMaiDaNhan = async (): Promise<void> => {
    try {
      setLoading(true);
      if (!isAuthenticated()) {
        setError('Vui lòng đăng nhập để xem khuyến mãi đã nhận');
        return;
      }

      const response = await khuyenMaiAPI.getKhuyenMaiDaNhan();
      setKhuyenMaiDaNhan(response.data);
    } catch (error: any) {
      console.error('Error loading received promotions:', error);
      if (error.response?.status === 401) {
        setError('Vui lòng đăng nhập để xem khuyến mãi đã nhận');
      } else if (error.response?.status === 404) {
        setError('Bạn chưa nhận khuyến mãi nào');
      } else {
        setError('Không thể tải danh sách khuyến mãi đã nhận');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKhuyenMaiDaNhan();
  }, []);

  // CSS Styles
  const pageStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  };

  const titleStyle: React.CSSProperties = {
    color: '#e74c3c',
    marginBottom: '30px',
    textAlign: 'center',
  };

  const listStyle: React.CSSProperties = {
    display: 'grid',
    gap: '15px',
  };

  const itemStyle: React.CSSProperties = {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '15px',
    background: 'white',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  };

  const loadingStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '50px 20px',
  };

  const errorStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#e74c3c',
  };

  const emptyStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#666',
  };

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

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={loadingStyle}>
          <div style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Đang tải khuyến mãi đã nhận...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <div style={errorStyle}>
          <p>{error}</p>
          <button 
            style={{
              background: '#3498db',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
            onClick={loadKhuyenMaiDaNhan}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <h1 style={titleStyle}>Khuyến Mãi Đã Nhận</h1>
      
      {khuyenMaiDaNhan.length > 0 ? (
        <div style={listStyle}>
          {khuyenMaiDaNhan.map(item => (
            <div key={`${item.MaKM}-${item.MaTK}`} style={itemStyle}>
              <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>
                {item.MaKM_khuyenmai?.TenKM || 'Khuyến mãi'}
              </h3>
              <p style={{ color: '#666', marginBottom: '10px' }}>
                {item.MaKM_khuyenmai?.MoTa || 'Không có mô tả'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                <span>Số lần đã sử dụng: <strong>{item.SoLanSuDung}</strong></span>
                <span>
                  HSD: <strong>
                    {item.MaKM_khuyenmai ? 
                      new Date(item.MaKM_khuyenmai.NgayKetThuc).toLocaleDateString('vi-VN') : 
                      'Không xác định'
                    }
                  </strong>
                </span>
              </div>
              {item.MaKM_khuyenmai?.DieuKien && (
                <div style={{ marginTop: '8px', color: '#666' }}>
                  Điều kiện áp dụng: Đơn tối thiểu {formatCurrency(item.MaKM_khuyenmai.DieuKien)}
                </div>
              )}
              {item.NgayNhan && (
                <div style={{ marginTop: '8px', color: '#666', fontSize: '0.9em' }}>
                  Ngày nhận: {new Date(item.NgayNhan).toLocaleDateString('vi-VN')}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p style={emptyStyle}>Bạn chưa nhận khuyến mãi nào</p>
      )}
    </div>
  );
};

export default KhuyenMaiDaNhanPage;