import React from 'react';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  React.useEffect(() => {
    if (!loading && !user) {
      // Redirect đến trang login nếu chưa đăng nhập
      window.location.href = '/signin';
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Đang tải...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Chuyển hướng đến trang đăng nhập...</div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;