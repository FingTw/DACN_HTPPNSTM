// frontend/src/pages/Blockchain/Admin.tsx
import React, { useState, useEffect } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import { blockchainAPI } from '../../services/blockchainApi';
import type { BlockchainBlock, ApiResponse } from '../../services/blockchainApi';
import { socketService } from '../../services/socketService';

const Admin: React.FC = () => {
  const [blocks, setBlocks] = useState<BlockchainBlock[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalBlocks, setTotalBlocks] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const styles: { [key: string]: CSSProperties } = {
    container: {
      margin: 0,
      boxSizing: 'border-box',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: '#f5f5f5',
      padding: '20px',
      minHeight: '100vh'
    },
    navbar: {
      background: '#1a237e',
      color: 'white',
      padding: '20px',
      borderRadius: '10px',
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '15px'
    },
    navbarTitle: {
      fontSize: '24px',
      marginBottom: '10px'
    },
    totalBlocks: {
      background: '#e8eaf6',
      color: '#1a237e',
      padding: '10px 20px',
      borderRadius: '5px',
      fontWeight: 'bold'
    },
    refreshBtn: {
      background: '#4caf50',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '14px'
    },
    refreshBtnDisabled: {
      background: '#cccccc',
      cursor: 'not-allowed'
    },
    blockchain: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    block: {
      background: 'white',
      padding: '20px',
      borderRadius: '10px',
      marginBottom: '20px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      position: 'relative',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    },
    genesisBlock: {
      background: '#fff8e1',
      border: '2px solid #ffd54f'
    },
    blockHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px',
      paddingBottom: '10px',
      borderBottom: '1px solid #eee'
    },
    blockTimestamp: {
      color: '#666',
      fontSize: '14px'
    },
    hashSection: {
      background: '#f8f9fa',
      padding: '12px',
      borderRadius: '5px',
      margin: '10px 0',
      fontFamily: "'Courier New', monospace",
      wordBreak: 'break-all',
      fontSize: '14px',
      borderLeft: '4px solid #1a237e'
    },
    hashLabel: {
      color: '#666',
      fontSize: '12px',
      marginBottom: '5px',
      fontWeight: 'bold'
    },
    dataSection: {
      background: '#e3f2fd',
      padding: '15px',
      borderRadius: '5px',
      marginTop: '15px',
      borderLeft: '4px solid #2196f3'
    },
    genesisDataSection: {
      background: '#fff3e0',
      borderLeftColor: '#ffb300'
    },
    dataItem: {
      margin: '8px 0',
      padding: '5px 0',
      borderBottom: '1px solid #bbdefb'
    },
    dataItemLast: {
      borderBottom: 'none'
    },
    dataItemStrong: {
      color: '#1a237e',
      minWidth: '120px',
      display: 'inline-block'
    },
    loadingText: {
      textAlign: 'center',
      padding: '40px',
      color: '#666',
      fontSize: '18px'
    },
    connectionStatus: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      marginLeft: '15px'
    },
    connectionDot: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      display: 'inline-block'
    }
  };

  const loadBlockchain = async (): Promise<void> => {
    setLoading(true);
    try {
      const response: ApiResponse<BlockchainBlock[]> = await blockchainAPI.getFullChain();
      if (response.success) {
        setBlocks(response.data || []);
        setTotalBlocks(response.data?.length || 0);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('❌ Lỗi tải blockchain:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    socketService.connect();
    
    // Listen for connection status
    const checkConnection = setInterval(() => {
      setIsConnected(socketService.getConnectionStatus());
    }, 1000);

    // Listen for new blocks (cast to any because these helpers may not be declared on the SocketService type)
    (socketService as any).onNewBlock?.((data: any) => {
      console.log('🆕 New block received:', data);
      loadBlockchain(); // Reload blockchain when new block is added
    });

    // Listen for blockchain updates
    (socketService as any).onBlockchainUpdate?.((data: any) => {
      console.log('📡 Blockchain update:', data);
    });

    return () => {
      clearInterval(checkConnection);
      socketService.disconnect();
    };
  }, []);

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  const formatLastUpdate = (date: Date): string => {
    return date.toLocaleTimeString('vi-VN');
  };

  const getBlockStyle = (index: number): CSSProperties => {
    const baseStyle = { ...styles.block };
    if (index === 0) {
      Object.assign(baseStyle, styles.genesisBlock);
    }
    return baseStyle;
  };

  const handleMouseEnter = (e: MouseEvent<HTMLDivElement>): void => {
    if (!loading) {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
    }
  };

  const handleMouseLeave = (e: MouseEvent<HTMLDivElement>): void => {
    if (!loading) {
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    }
  };

  const handleRefreshHover = (e: MouseEvent<HTMLButtonElement>): void => {
    if (!loading) {
      e.currentTarget.style.background = '#43a047';
    }
  };

  const handleRefreshLeave = (e: MouseEvent<HTMLButtonElement>): void => {
    if (!loading) {
      e.currentTarget.style.background = '#4caf50';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={styles.navbarTitle}>🔍 Blockchain Explorer</h1>
            <div style={styles.totalBlocks}>
              Tổng số block: {loading ? 'Loading...' : totalBlocks}
            </div>
          </div>
          <div style={styles.connectionStatus}>
            <span 
              style={{
                ...styles.connectionDot,
                background: isConnected ? '#4CAF50' : '#f44336'
              }} 
            />
            {isConnected ? 'Đã kết nối' : 'Mất kết nối'}
            <small>Cập nhật: {formatLastUpdate(lastUpdate)}</small>
          </div>
        </div>
        <button 
          onClick={loadBlockchain} 
          style={{
            ...styles.refreshBtn,
            ...(loading ? styles.refreshBtnDisabled : {})
          }}
          disabled={loading}
          onMouseOver={handleRefreshHover}
          onMouseOut={handleRefreshLeave}
        >
          {loading ? '⏳ Đang tải...' : '🔄 Làm mới'}
        </button>
      </div>

      <div style={styles.blockchain}>
        {loading ? (
          <div style={styles.loadingText}>🔄 Đang tải dữ liệu blockchain...</div>
        ) : (
          Array.isArray(blocks) && blocks.map((block, index) => (
            <div 
              key={block.hash || index} 
              style={getBlockStyle(index)}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div style={styles.blockHeader}>
                <span style={getBlockIndexStyle(index)}>
                  Block #{index} {index === 0 && '(Genesis Block)'}
                </span>
                <span style={styles.blockTimestamp}>
                  {formatTimestamp(block.timestamp)}
                </span>
              </div>
              
              <div style={styles.hashSection}>
                <div style={styles.hashLabel}>📝 Block Hash:</div>
                {block.hash || 'N/A'}
              </div>
              
              <div style={styles.hashSection}>
                <div style={styles.hashLabel}>↩️ Previous Hash:</div>
                {block.previousHash || 'N/A'}
              </div>
              
              <div style={getDataSectionStyle(index)}>
                <div style={styles.dataItem}>
                  <strong style={styles.dataItemStrong}>Mã sản phẩm:</strong> {block.data?.productId || 'N/A'}
                </div>
                <div style={styles.dataItem}>
                  <strong style={styles.dataItemStrong}>Trạng thái:</strong> {block.data?.status || 'N/A'}
                </div>
                <div style={styles.dataItem}>
                  <strong style={styles.dataItemStrong}>Vị trí:</strong> {block.data?.location || 'N/A'}
                </div>
                <div style={styles.dataItem}>
                  <strong style={styles.dataItemStrong}>Người thực hiện:</strong> {block.data?.actor || 'N/A'}
                </div>
                <div style={styles.dataItem}>
                  <strong style={styles.dataItemStrong}>Vai trò:</strong> {block.data?.role || 'N/A'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Helper functions với proper types
const getBlockIndexStyle = (index: number): CSSProperties => {
  const baseStyle: CSSProperties = {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1a237e'
  };
  
  if (index === 0) {
    return { ...baseStyle, color: '#ff6f00' };
  }
  return baseStyle;
};

const getDataSectionStyle = (index: number): CSSProperties => {
  const baseStyle: CSSProperties = {
    background: '#e3f2fd',
    padding: '15px',
    borderRadius: '5px',
    marginTop: '15px',
    borderLeft: '4px solid #2196f3'
  };
  
  if (index === 0) {
    return { 
      ...baseStyle, 
      background: '#fff3e0',
      borderLeftColor: '#ffb300'
    };
  }
  return baseStyle;
};

export default Admin;