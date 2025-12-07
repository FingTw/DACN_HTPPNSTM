// src/pages/employee/EmployeeLayout.tsx
import React, { useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Truck,
  Package,
  LogOut,
  MapPin,
  ClipboardList,
  Box,
  ArrowRightLeft,
} from "lucide-react";

const EmployeeLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Kiểm tra quyền truy cập
  useEffect(() => {
    if (!user) {
      navigate("/dang-nhap");
      return;
    }

    const role = (user as any).Role || (user as any).vaitro; // Tùy vào cách bạn lưu trong context

    if (
      role !== "Nhân Viên" &&
      role !== "NhanVienKho" &&
      role !== "Shipper" &&
      role !== "Admin"
    ) {
      alert("Bạn không có quyền truy cập trang nhân viên!");
      navigate("/");
    }
  }, [user, navigate]);

  if (!user) return null;

  const role = (user as any).Role || (user as any).vaitro;

  // 🚚 MENU CHO SHIPPER
  const shipperMenu = [
    {
      path: "/employee/shipper/tasks",
      label: "Nhiệm vụ",
      icon: <ClipboardList size={20} />,
    },
    {
      path: "/employee/shipper/map",
      label: "Bản đồ",
      icon: <MapPin size={20} />,
    },
    {
      path: "/employee/shipper/history",
      label: "Lịch sử",
      icon: <Package size={20} />,
    },
  ];

  // 🏭 MENU CHO THỦ KHO
  const warehouseMenu = [
    {
      path: "/employee/warehouse/import",
      label: "Nhập kho",
      icon: <Box size={20} />,
    },
    {
      path: "/employee/warehouse/export",
      label: "Xuất kho",
      icon: <ArrowRightLeft size={20} />,
    },
    {
      path: "/employee/warehouse/inventory",
      label: "Tồn kho",
      icon: <ClipboardList size={20} />,
    },
  ];

  const menuItems = role === "Shipper" ? shipperMenu : warehouseMenu;
  const themeColor = role === "Shipper" ? "bg-blue-600" : "bg-orange-600";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* --- SIDEBAR (Desktop) / HEADER (Mobile) --- */}
      <aside
        className={`md:w-64 ${themeColor} text-white shadow-lg z-20 flex-shrink-0`}
      >
        <div className="p-4 flex items-center justify-between md:block">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {role === "Shipper" ? <Truck /> : <Box />}
              {role === "Shipper" ? "SHIPPER APP" : "QUẢN LÝ KHO"}
            </h1>
            <p className="text-xs opacity-80 mt-1">
              Xin chào, {user.TenDangNhap}
            </p>
          </div>

          {/* Mobile Logout Button */}
          <button
            onClick={logout}
            className="md:hidden p-2 bg-white/20 rounded-lg"
          >
            <LogOut size={20} />
          </button>
        </div>

        <nav className="p-2 md:p-4 flex overflow-x-auto md:flex-col gap-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
                location.pathname === item.path
                  ? "bg-white text-gray-800 font-bold shadow-md"
                  : "text-white/80 hover:bg-white/10"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="hidden md:block absolute bottom-0 w-64 p-4 border-t border-white/20">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full text-white/80 hover:bg-white/10 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default EmployeeLayout;
