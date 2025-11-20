// src/components/rfq/layout/RFQSidebar.tsx
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  List,
  Search,
  FileText,
  ShoppingBag,
  Store,
  RefreshCcw,
  Globe,
} from "lucide-react";

interface SidebarProps {
  isBuyer: boolean;
  isSeller: boolean;
}

export default function RFQSidebar({ isBuyer, isSeller }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Xác định mode mặc định dựa trên URL hiện tại
  // Nếu URL chứa 'seller' -> set Seller Mode, ngược lại -> Buyer Mode
  const [activeRole, setActiveRole] = useState<"BUYER" | "SELLER">(() => {
    if (location.pathname.includes("/rfq/seller")) return "SELLER";
    return "BUYER";
  });

  const commonMenu = [
    {
      label: "Sàn Yêu Cầu (Trang chủ)",
      path: "/rfq",
      icon: Globe,
      exact: true,
    },
  ];
  // Menu cho Buyer
  const buyerMenu = [
    {
      label: "Dashboard Mua",
      path: "/rfq/buyer",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Tạo yêu cầu mới",
      path: "/rfq/buyer/create",
      icon: PlusCircle,
    },
    {
      label: "Yêu cầu của tôi",
      path: "/rfq/buyer/requests",
      icon: List,
    },
  ];

  // Menu cho Seller
  const sellerMenu = [
    {
      label: "Dashboard Bán",
      path: "/rfq/seller",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Chợ yêu cầu (Tìm mối)",
      path: "/rfq/seller/requests",
      icon: Search,
    },
    {
      label: "Đề nghị đã gửi",
      path: "/rfq/seller/proposals",
      icon: FileText,
    },
  ];

  // Hàm xử lý chuyển đổi Role
  const handleSwitchRole = (role: "BUYER" | "SELLER") => {
    setActiveRole(role);
    // Khi chuyển role, tự động navigate về dashboard của role đó để tránh lỗi logic
    if (role === "BUYER") navigate("/rfq/buyer");
    else navigate("/rfq/seller");
  };

  // Đồng bộ state nếu người dùng gõ URL trực tiếp
  useEffect(() => {
    if (location.pathname.includes("/rfq/seller")) setActiveRole("SELLER");
    else if (location.pathname.includes("/rfq/buyer")) setActiveRole("BUYER");
  }, [location.pathname]);

  // Chọn menu để hiển thị
  const currentMenu = [
    ...commonMenu,
    ...(activeRole === "SELLER" ? sellerMenu : buyerMenu),
  ];

  // Kiểm tra link active
  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-full md:w-72 lg:w-80 bg-white rounded-xl shadow-xl flex-shrink-0 min-h-[calc(100vh-64px)] flex flex-col m-4 mb-2">
      {/* === PHẦN CHUYỂN ĐỔI ROLE (Chỉ hiện nếu có cả 2 quyền) === */}
      {isBuyer && isSeller && (
        <div className="p-4 grid gap-2 rounded-xl bg-gray-50 shadow-xl m-4 mb-2">
          <div className="flex p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => handleSwitchRole("BUYER")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                activeRole === "BUYER"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Mua hàng
            </button>
            <button
              onClick={() => handleSwitchRole("SELLER")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                activeRole === "SELLER"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Store className="w-4 h-4" />
              Bán hàng
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 px-2">
            <RefreshCcw className="w-3 h-3" />
            <span>
              Đang xem giao diện{" "}
              {activeRole === "BUYER" ? "Người Mua" : "Nhà Cung Cấp"}
            </span>
          </div>
        </div>
      )}

      {/* === MENU DANH SÁCH === */}
      <div className="p-4 flex-1">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">
          {activeRole === "BUYER" ? "Quản lý mua hàng" : "Quản lý bán hàng"}
        </h2>
        <nav className="space-y-1 bg-gray-100 rounded-xl">
          {currentMenu.map((item) => {
            const active = isActive(item.path, item.exact);
            // Màu sắc active khác nhau cho Buyer (Xanh) và Seller (Cam) để dễ phân biệt
            const activeClass =
              activeRole === "BUYER"
                ? "bg-blue-50 text-green-700 border-green-200"
                : "bg-orange-50 text-green-700 border-green-200";

            const iconColor =
              activeRole === "BUYER"
                ? active
                  ? "text-green-600"
                  : "text-gray-400"
                : active
                ? "text-green-600"
                : "text-gray-400";

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium border border-transparent ${
                  active
                    ? activeClass
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className={`w-5 h-5 ${iconColor}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Sidebar */}
      <div className="p-4 mt-auto border-t border-gray-100">
        {/* Nếu người dùng chỉ có 1 quyền, có thể gợi ý họ đăng ký quyền kia ở đây */}
        {!isSeller && isBuyer && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
            <h3 className="text-sm font-bold text-orange-800">
              Bạn muốn bán hàng?
            </h3>
            <p className="text-xs text-orange-600 mt-1 mb-2">
              Đăng ký shop ngay để tiếp cận khách hàng.
            </p>
            <Link
              to="/signupshop"
              className="block w-full text-center bg-white text-orange-600 text-xs font-bold py-2 rounded-lg shadow-sm border border-orange-200"
            >
              Đăng ký Seller
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
