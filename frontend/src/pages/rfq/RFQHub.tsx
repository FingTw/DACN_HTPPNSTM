// src/pages/rfq/RFQHub.tsx
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import RFQSidebar from "@/components/rfq/RFQSidebar";
import { AlertCircle } from "lucide-react";

export default function RFQHub() {
  const { hasRole, user } = useAuth();
  const location = useLocation();

  const isBuyer = hasRole(["Khách Hàng", "Buyer", "Admin"]);
  const isSeller = hasRole(["Người Bán", "Seller", "Cửa Hàng", "Admin"]);

  // Nếu chưa đăng nhập hoặc không có quyền
  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (!isBuyer && !isSeller) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 bg-white rounded-xl shadow-sm">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">
              Truy cập bị từ chối
            </h2>
            <p className="text-gray-600 mt-2">
              Tài khoản của bạn không có quyền truy cập RFQ.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 1. Header Toàn cục */}
      <Header />

      {/* 2. Layout Body: Sidebar + Content */}
      <div className="flex flex-1 flex-col md:flex-row max-w-[1920px] mx-auto w-full">
        {/* Sidebar: Bên trái (Responsive: ẩn trên mobile hoặc hiện trên cùng) */}
        <RFQSidebar isBuyer={isBuyer} isSeller={isSeller} />

        {/* Main Content: Bên phải (Chiếm phần còn lại) */}
        <main className="flex-1 min-w-0 bg-gray-50 p-4 md:p-8 overflow-y-auto h-[calc(100vh-64px)]">
          <div className="max-w-6xl mx-auto">
            {/* Outlet là nơi các trang con (Dashboard, Detail...) sẽ hiển thị */}
            <Outlet />
          </div>
        </main>
      </div>

      {/* Footer có thể để ở đây hoặc bỏ nếu muốn giao diện full màn hình kiểu Dashboard app */}
      {/* <Footer /> */}
    </div>
  );
}
