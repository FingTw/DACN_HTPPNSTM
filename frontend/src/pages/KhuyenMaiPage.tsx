import React, { useState, useEffect, useContext } from 'react';
import KhuyenMaiCard from '../components/voucher/KhuyenMaiCard';
import type { KhuyenMai, KhuyenMaiResponse } from '@/services/khuyenmaiApi';
import { khuyenMaiAPI } from '@/services/khuyenmaiApi';
import { useAuth } from '@/context/AuthContext';

const KhuyenMaiPage: React.FC = () => {
  const [khuyenMaiList, setKhuyenMaiList] = useState<KhuyenMai[]>([]);
  const [receivedMaKMs, setReceivedMaKMs] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const { isAuthenticated } = useAuth();

  const loadKhuyenMai = async (): Promise<void> => {
    try {
      setLoading(true);
      if (!isAuthenticated()) {
        setError('Vui lòng đăng nhập để xem khuyến mãi');
        return;
      }

      const response = await khuyenMaiAPI.getKhuyenMaiForCustomer();
      const data: KhuyenMaiResponse = response.data;
      setKhuyenMaiList(data.allKhuyenMai);
      setReceivedMaKMs(data.receivedMaKMs);
    } catch (err: any) {
      console.error('Error loading promotions:', err);
      if (err.response?.status === 401) {
        setError('Vui lòng đăng nhập để xem khuyến mãi');
      } else if (err.response?.status === 404) {
        setError('Không tìm thấy khuyến mãi nào');
      } else {
        setError('Không thể tải danh sách khuyến mãi');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKhuyenMai();
  }, []);

  // ✅ SỬA: LOẠI BỎ ASYNC - CHỈ CẬP NHẬT STATE
  const handleReceiveKhuyenMai = (MaKM: string): void => {
    console.log("🔄 Cập nhật state với MaKM:", MaKM);
    
    // ✅ CẬP NHẬT STATE NGAY LẬP TỨC
    setReceivedMaKMs(prev => {
      // ✅ KIỂM TRA TRÙNG LẶP TRƯỚC KHI THÊM
      if (prev.includes(MaKM)) {
        console.log("⚠️ MaKM đã tồn tại trong state:", MaKM);
        return prev;
      }
      const newReceivedMaKMs = [...prev, MaKM];
      console.log("✅ State mới:", newReceivedMaKMs);
      return newReceivedMaKMs;
    });
  };

  // CSS Styles (giữ nguyên)
  const pageStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '40px',
  };

  const titleStyle: React.CSSProperties = {
    color: '#e74c3c',
    marginBottom: '10px',
    fontSize: '2.5rem',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
    marginTop: '30px',
  };

  const loadingStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '50px 20px',
  };

  const errorStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '50px 20px',
    color: '#e74c3c',
  };

  const retryButtonStyle: React.CSSProperties = {
    background: '#3498db',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '10px',
  };

  const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#666',
    gridColumn: '1 / -1',
  };

  // Add keyframes for spinner animation
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
          <p>Đang tải khuyến mãi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <div style={errorStyle}>
          <p>{error}</p>
          <button style={retryButtonStyle} onClick={loadKhuyenMai}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>🎉 Khuyến Mãi Hấp Dẫn</h1>
        <p style={{ color: '#666', fontSize: '1.1em' }}>
          Nhận ngay các voucher giảm giá và ưu đãi đặc biệt
        </p>
      </div>

      <div style={gridStyle}>
        {khuyenMaiList.length > 0 ? (
          khuyenMaiList.map(khuyenMai => (
            <KhuyenMaiCard
              key={khuyenMai.MaKM}
              khuyenMai={khuyenMai}
              isReceived={receivedMaKMs.includes(khuyenMai.MaKM)}
              onReceive={handleReceiveKhuyenMai} 
            />
          ))
        ) : (
          <div style={emptyStateStyle}>
            <h3>😔 Hiện không có khuyến mãi nào</h3>
            <p>Vui lòng quay lại sau để nhận các ưu đãi mới nhất!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KhuyenMaiPage;