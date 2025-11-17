import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/authService";

interface User {
  MaTK: string;
  TenDangNhap: string;
  role: string;
  HoTen: string;
  MaCH?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      // DANH SÁCH CÁC ROUTE ĐƯỢC PHÉP TRUY CẬP KHI CHƯA LOGIN
      const publicRoutes = ['/signin', '/signup', '/', '/product', '/cart'];
      const currentPath = window.location.pathname;

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (err) {
          console.error("Lỗi parse user:", err);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      } else {
        setUser(null);
        
        // CHỈ REDIRECT NẾU ĐANG Ở TRANG KHÔNG PHẢI PUBLIC ROUTE
        const isPublicRoute = publicRoutes.some(route => 
          currentPath === route || currentPath.startsWith(route + '/')
        );
        
        if (!token && !isPublicRoute) {
          window.location.href = '/signin';
        }
      }
      setLoading(false);
    };

    initializeAuth();

    const handleAuthChange = () => {
      initializeAuth();
    };

    window.addEventListener("authChange", handleAuthChange);

    return () => {
      window.removeEventListener("authChange", handleAuthChange);
    };
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    window.dispatchEvent(new Event("authChange"));
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      window.dispatchEvent(new Event("authChange"));
      window.location.href = "/signin";
    }
  };

  const isAuthenticated = (): boolean => {
    return !!localStorage.getItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};