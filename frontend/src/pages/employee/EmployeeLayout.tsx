// src/pages/employee/EmployeeLayout.tsx
import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { adminService, type Employee } from "@/services/adminService";
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
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [employeeRole, setEmployeeRole] = useState<string | null>(null);

  // Kiểm tra quyền truy cập và xác thực tài khoản là nhân viên
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/signin");
      return;
    }

    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const MaTK =
          (user as any).MaTK || (user as any).MaTk || (user as any).id;
        if (!MaTK) {
          alert("Không xác định được mã tài khoản");
          navigate("/");
          return;
        }

        const res = await adminService.getEmployeeDetail(MaTK);
        // Nếu không có dữ liệu nhân viên, chặn truy cập
        if (!res) {
          alert("Bạn không phải nhân viên hệ thống");
          navigate("/");
          return;
        }

        setEmployee(res);

        // Xác định loại nhân viên: ưu tiên role từ token, fallback dựa trên TenCV
        const tokenRole =
          (user as any).Role || (user as any).role || (user as any).LoaiTK;
        let type: string | null = null;
        if (typeof tokenRole === "string" && /shipper/i.test(tokenRole))
          type = "Shipper";
        if (typeof tokenRole === "string" && /(kho|warehouse)/i.test(tokenRole))
          type = "Warehouse";

        const tenCV = res.MaCV_chucvu?.TenCV || "";
        if (!type) {
          if (/shipper|giao hàng|shp/i.test(tenCV)) type = "Shipper";
          else if (/kho|thủ kho|warehouse/i.test(tenCV)) type = "Warehouse";
        }

        // Mặc định nếu vẫn chưa xác định, gán "Employee"
        setEmployeeRole(type || "Employee");

        // Nếu là Shipper, redirect về tasks; nếu Warehouse thì redirect về import page
        if (type === "Shipper") navigate("/employee/shipper/tasks");
        else if (type === "Warehouse") navigate("/employee/warehouse/import");
      } catch (err: any) {
        // Nếu server trả 404 hoặc lỗi -> không phải nhân viên
        console.error("Lỗi kiểm tra nhân viên:", err?.message || err);
        alert(
          "Bạn không phải nhân viên hệ thống hoặc có lỗi khi kiểm tra quyền"
        );
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [user, navigate, authLoading]);

  if (!user || loading) return null;

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

  const menuItems = employeeRole === "Shipper" ? shipperMenu : warehouseMenu;
  const themeColor =
    employeeRole === "Shipper" ? "bg-blue-600" : "bg-orange-600";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* --- SIDEBAR (Desktop) / HEADER (Mobile) --- */}
      <aside
        className={`md:w-64 ${themeColor} text-white shadow-lg z-20 flex-shrink-0`}
      >
        <div className="p-4 flex items-center justify-between md:block">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {employeeRole === "Shipper" ? <Truck /> : <Box />}
              {employeeRole === "Shipper" ? "SHIPPER APP" : "QUẢN LÝ KHO"}
            </h1>
            <p className="text-xs opacity-80 mt-1">
              Xin chào, {employee?.HoTen || user.TenDangNhap}
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
