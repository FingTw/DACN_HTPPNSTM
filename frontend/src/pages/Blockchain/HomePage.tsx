import React, { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { io, Socket } from 'socket.io-client';
import { blockchainAPI, isAuthenticated, getCurrentUser } from '../../services/blockchainApi';

// ✅ Định nghĩa các kiểu dữ liệu
interface User {
  TenDangNhap: string;
  VaiTro: string;
}

interface BlockData {
  blockIndex?: number;
  hash?: string;
  nonce?: number;
  status: string;
  timestamp: number;
  location: string;
  actor: string;
}

interface ProductHistory {
  productId: string;
  history?: BlockData[];
  error?: string;
}

interface Notification {
  id: number;
  actor: string;
  role: string;
  status: string;
  blockIndex: number;
  timestamp: string;
}

const HomePage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [productId, setProductId] = useState<string>('');
  const [searchResult, setSearchResult] = useState<ProductHistory | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const currentProductIdRef = useRef<string | null>(null);

  // 🌈 Role mapping
  const roleNames: Record<string, string> = {
    Farmer: '🌾 Nông dân',
    Shipper: '🚚 Vận chuyển',
    Factory: '🏭 Nhà máy',
    CuaHang: '🏪 Cửa hàng',
    KhachHang: '👤 Khách hàng',
    Admin: '👑 Quản trị viên',
  };

  // 🧠 Xử lý logic
  useEffect(() => {
    checkAuth();
    initWebSocket();
    autoSearchFromURL();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const checkAuth = () => {
    if (!isAuthenticated()) return;
    const user = getCurrentUser();
    if (user) setCurrentUser(user);
  };

  const initWebSocket = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    socketRef.current = io(API_BASE_URL, { transports: ['websocket', 'polling'] });

    socketRef.current?.on('connect', () => {
        console.log('🔌 WebSocket connected:', socketRef.current?.id);
        if (currentProductIdRef.current) {
            socketRef.current?.emit('subscribe:product', currentProductIdRef.current);
        }
    });


    socketRef.current.on('blockchain:newBlock', (data: any) => {
      console.log('📡 New block received:', data);
      if (currentProductIdRef.current && data.productId === currentProductIdRef.current) {
        showRealtimeNotification(data);
        setTimeout(() => handleSearch(currentProductIdRef.current!, true), 1000);
      }
    });
  };

  const showRealtimeNotification = (data: any) => {
    const notification: Notification = {
      id: Date.now(),
      actor: data.actor,
      role: data.role,
      status: data.status,
      blockIndex: data.blockIndex,
      timestamp: data.timestamp,
    };

    setNotifications((prev) => [notification, ...prev]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    }, 3000);
  };

  const handleSearch = async (searchProductId = productId, isRealtimeUpdate = false) => {
    if (!searchProductId.trim()) return;
    setLoading(true);

    if (currentProductIdRef.current && socketRef.current) {
      socketRef.current.emit('unsubscribe:product', currentProductIdRef.current);
    }

    currentProductIdRef.current = searchProductId;
    if (socketRef.current) {
      socketRef.current.emit('subscribe:product', searchProductId);
    }

    try {
      const response = await blockchainAPI.getProductHistory(searchProductId);
      if (response.success) {
        setSearchResult({ productId: searchProductId, history: response.data || [] });
      } else {
        setSearchResult({ productId: searchProductId, error: response.message || 'Có lỗi xảy ra' });
      }
    } catch (error: any) {
      setSearchResult({ productId: searchProductId, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const autoSearchFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('productId');
    if (pid) {
      setProductId(pid);
      setTimeout(() => handleSearch(pid), 1000);
    }
  };

  // 🧩 Render Functions
  const renderRoleActions = () => {
    if (!currentUser) return null;

    let actions = [
      {
        title: '📝 Thêm Trạng Thái Mới',
        description: 'Cập nhật trạng thái mới cho sản phẩm vào blockchain',
        action: () => (window.location.href = '/blockchain/dashboard'),
      },
      {
        title: '🔍 Xem Blockchain',
        description: 'Xem toàn bộ chuỗi khối',
        action: () => (window.location.href = '/blockchain/admin'),
      },
    ];

    switch (currentUser.VaiTro) {
      case 'Farmer':
        actions.push({
          title: '🌾 Quản Lý Thu Hoạch',
          description: 'Ghi nhận thông tin thu hoạch mới',
          action: () => (window.location.href = '/blockchain/dashboard'),
        });
        break;
      case 'Shipper':
        actions.push({
          title: '🚚 Quản Lý Vận Chuyển',
          description: 'Cập nhật trạng thái vận chuyển',
          action: () => (window.location.href = '/blockchain/dashboard'),
        });
        break;
      case 'Factory':
        actions.push({
          title: '🏭 Quản Lý Sản Xuất',
          description: 'Ghi nhận các giai đoạn sản xuất',
          action: () => (window.location.href = '/blockchain/dashboard'),
        });
        break;
      case 'CuaHang':
        actions.push({
          title: '🏪 Quản Lý Bán Lẻ',
          description: 'Ghi nhận thông tin bán hàng',
          action: () => (window.location.href = '/blockchain/dashboard'),
        });
        break;
    }

    return (
      <div style={{ display: 'grid', gap: '20px', marginTop: '30px' }}>
        {actions.map((a, i) => (
          <div key={i} style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 3px 10px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: '#1a237e' }}>{a.title}</h3>
            <p>{a.description}</p>
            <button onClick={a.action} style={{ background: '#1a237e', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>
              {a.title.includes('Thêm') ? 'Vào Dashboard' : a.title.split(' ')[1]}
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderSearchResult = () => {
    if (!searchResult) return null;

    if (searchResult.error) {
      return (
        <div style={{ textAlign: 'center', color: '#d32f2f', background: '#fce4ec', padding: '20px', borderRadius: '8px' }}>
          ❌ {searchResult.error}
        </div>
      );
    }

    if (!searchResult.history || searchResult.history.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666', background: '#f8f9fa', borderRadius: '8px' }}>
          ℹ️ Không tìm thấy lịch sử cho sản phẩm <strong>{searchResult.productId}</strong>.
        </div>
      );
    }

    return (
      <>
        <h3 style={{ color: '#1a237e' }}>📦 Lịch sử sản phẩm: {searchResult.productId}</h3>
        <div style={{ marginTop: '20px' }}>
          {searchResult.history.map((item, idx) => (
            <div key={idx} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
              <div>
                <strong>⛓️ Block #{item.blockIndex}</strong> | Hash: {item.hash?.substring(0, 16)}... | Nonce: {item.nonce}
              </div>
              <div>📍 {item.status}</div>
              <div>🕒 {new Date(item.timestamp).toLocaleString('vi-VN')}</div>
              <div>📍 {item.location}</div>
              <div>👤 {item.actor}</div>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <div style={{ background: '#1a237e', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between' }}>
        <h1>📦 Supply Chain Blockchain</h1>
        <div>
          {!currentUser ? (
            <>
              <button onClick={() => (window.location.href = '/blockchain/login')} style={{ background: '#4caf50', color: '#fff', padding: '8px 20px', borderRadius: '5px' }}>
                Đăng nhập
              </button>
              <button onClick={() => (window.location.href = '/blockchain/register')} style={{ marginLeft: '10px', background: 'white', color: '#1a237e', padding: '8px 20px', borderRadius: '5px' }}>
                Đăng ký
              </button>
            </>
          ) : (
            <>
              <span>👤 {currentUser.TenDangNhap} ({roleNames[currentUser.VaiTro] || currentUser.VaiTro})</span>
              <button
                onClick={() => {
                  blockchainAPI.logout();
                  window.location.reload();
                }}
                style={{ marginLeft: '15px', background: '#4caf50', color: 'white', padding: '8px 20px', borderRadius: '5px' }}
              >
                Đăng xuất
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input type="text" value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="Nhập mã sản phẩm..." style={{ flex: 1, padding: '12px' }} />
          <button type="submit" disabled={loading} style={{ background: '#1a237e', color: 'white', padding: '12px 20px', borderRadius: '5px' }}>
            {loading ? '⏳ Đang tìm...' : 'Tra cứu'}
          </button>
        </form>

        {notifications.map((n) => (
          <div key={n.id} style={{ background: '#4caf50', color: 'white', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
            🔔 {n.actor} ({roleNames[n.role]}) đã thêm {n.status} | Block #{n.blockIndex}
          </div>
        ))}

        {loading ? <p>⏳ Đang tìm kiếm trên blockchain...</p> : renderSearchResult()}
        {currentUser && renderRoleActions()}
      </div>
    </div>
  );
};

export default HomePage;
