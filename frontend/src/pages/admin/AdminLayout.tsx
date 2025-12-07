// src/pages/admin/AdminLayout.tsx
import React, { useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Users,
  Store,
  Box,
  Link as LinkIcon,
  Settings,
  LogOut,
  Bell,
  Building2,
  Briefcase,
  Tag,
  Warehouse,
  UserCog,
} from "lucide-react";

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // 🔒 Bảo vệ Route: Chỉ Admin mới được vào
  useEffect(() => {
    // Kiểm tra role (Giả sử user có trường role hoặc LoaiTK)
    const isAdmin =
      (user as any)?.role === "Admin" || (user as any)?.LoaiTK === "Admin";
    if (!user || !isAdmin) {
      // alert("Bạn không có quyền truy cập trang này!");
      // navigate("/");
      // Tạm thời comment để bạn test giao diện nếu chưa set role Admin trong DB
    }
  }, [user, navigate]);

  const menuItems = [
    {
      path: "/admin/dashboard",
      label: "Tổng quan",
      icon: <LayoutDashboard size={20} />,
    },
    { path: "/admin/users", label: "Người dùng", icon: <Users size={20} /> },
    {
      path: "/admin/employees",
      label: "Nhân viên",
      icon: <Briefcase size={20} />,
    },
    {
      path: "/admin/departments",
      label: "Phòng ban",
      icon: <Building2 size={20} />,
    },
    {
      path: "/admin/positions",
      label: "Chức vụ",
      icon: <Users size={20} />,
    },
    { path: "/admin/shops", label: "Cửa hàng", icon: <Store size={20} /> },
    { path: "/admin/products", label: "Sản phẩm", icon: <Box size={20} /> },
    {
      path: "/admin/categories",
      label: "Danh mục",
      icon: <Tag size={20} />,
    },
    {
      path: "/admin/warehouses",
      label: "Kho bãi",
      icon: <Warehouse size={20} />,
    },
    {
      path: "/admin/account-assignment",
      label: "Gán Tài Khoản",
      icon: <UserCog size={20} />,
    },
    {
      path: "/admin/blockchain",
      label: "Blockchain",
      icon: <LinkIcon size={20} />,
    },
    {
      path: "/admin/settings",
      label: "Cấu hình",
      icon: <Settings size={20} />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 fixed h-full z-20">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Hệ thống quản lý nông sản
          </p>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                location.pathname === item.path
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-700">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white h-16 shadow-sm flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {menuItems.find((i) => i.path === location.pathname)?.label ||
              "Dashboard"}
          </h2>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-800">
                  {(user as any)?.TenDangNhap || "Admin"}
                </p>
                <p className="text-xs text-emerald-600">Administrator</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold border-2 border-emerald-200">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
