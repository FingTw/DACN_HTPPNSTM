// ✅ components/PrivateRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactElement;
  allowedRoles?: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  allowedRoles = ['Admin', 'Cửa Hàng'],
}) => {
  const { hasRole, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Đang tải...</div>;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/signin" replace />;
  }

  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 20px', color: '#e74c3c' }}>
        <h2>⛔ Truy Cập Bị Từ Chối</h2>
        <p>Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  return children;
};

export default PrivateRoute;
