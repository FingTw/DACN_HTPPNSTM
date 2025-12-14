// src/pages/admin/AdminLayout.tsx
import React, { useEffect, useState } from "react";
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
  ChevronDown,
  Search,
  Wallet,
  Menu,
  X,
} from "lucide-react";

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Bảo vệ route (Giữ nguyên logic của bạn)
  useEffect(() => {
    const isAdmin =
      (user as any)?.role === "Admin" || (user as any)?.LoaiTK === "Admin";
    // if (!user || !isAdmin) { navigate("/"); }
  }, [user, navigate]);

  // Cấu trúc menu phân nhóm
  const menuGroups = [
    {
      title: "Tổng quan",
      items: [
        {
          path: "/admin/dashboard",
          label: "Dashboard",
          icon: <LayoutDashboard size={20} />,
        },
      ],
    },
    {
      title: "Quản lý hệ thống",
      items: [
        {
          path: "/admin/users",
          label: "Người dùng",
          icon: <Users size={20} />,
        },
        {
          path: "/admin/employees",
          label: "Nhân viên",
          icon: <Briefcase size={20} />,
        },
        { path: "/admin/shops", label: "Cửa hàng", icon: <Store size={20} /> },
        {
          path: "/admin/account-assignment",
          label: "Phân quyền",
          icon: <UserCog size={20} />,
        },
      ],
    },
    {
      title: "Tài chính & Kho vận",
      items: [
        { path: "/admin/products", label: "Sản phẩm", icon: <Box size={20} /> },
        {
          path: "/admin/withdrawals",
          label: "Rút tiền",
          icon: <Wallet size={20} />,
        }, // 🆕 MENU MỚI
        {
          path: "/admin/warehouses",
          label: "Kho bãi",
          icon: <Warehouse size={20} />,
        },
      ],
    },
    {
      title: "Cấu hình",
      items: [
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
        {
          path: "/admin/categories",
          label: "Danh mục",
          icon: <Tag size={20} />,
        },
        {
          path: "/admin/blockchain",
          label: "Blockchain",
          icon: <LinkIcon size={20} />,
        },
        {
          path: "/admin/settings",
          label: "Cài đặt",
          icon: <Settings size={20} />,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* --- SIDEBAR --- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "w-64" : "w-20"} 
          flex flex-col shadow-xl lg:shadow-none
        `}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-center border-b border-slate-100">
          {isSidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                A
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                AdminPanel
              </span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
              A
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
          {menuGroups.map((group, idx) => (
            <div key={idx}>
              {isSidebarOpen && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={!isSidebarOpen ? item.label : ""}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                        ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 shadow-sm font-medium"
                            : "text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
                        }
                      `}
                    >
                      <div
                        className={`${
                          isActive
                            ? "text-emerald-600"
                            : "text-slate-400 group-hover:text-emerald-500"
                        }`}
                      >
                        {item.icon}
                      </div>
                      {isSidebarOpen && <span>{item.label}</span>}

                      {/* Active Indicator Strip */}
                      {isActive && isSidebarOpen && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={logout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors ${
              !isSidebarOpen && "justify-center"
            }`}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-medium">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
        }`}
      >
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              {isSidebarOpen ? <Menu size={20} /> : <Menu size={20} />}
            </button>

            {/* Search Bar */}
            <div className="hidden md:flex items-center relative">
              <Search className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-emerald-500 w-64 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">
                  {(user as any)?.TenDangNhap || "Administrator"}
                </p>
                <p className="text-xs text-emerald-600 font-medium">
                  Super Admin
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-200 cursor-pointer hover:shadow-lg transition-all">
                {(user as any)?.TenDangNhap?.charAt(0).toUpperCase() || "A"}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Wrapper */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {/* Breadcrumb / Page Title Area can go here */}
          <div className="max-w-7xl mx-auto animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
