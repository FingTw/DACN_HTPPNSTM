// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import HomePage from "./pages/HomePage";
import CartPage from "./pages/CartPage";
import { Toaster } from "sonner";
import StoreRegistrationPage from "./components/shop/StoreRegistrationPage";
import StoreDetailsPage from "./components/shop/StoreDetailPage";
import ProductOverview from "./components/product/ProductOverview";
import CuahangDetailPage from "./pages/CuahangDetailPage";
import { CartProvider } from "@/context/CartContext";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import { AddressProvider } from "@/context/AddressContext";
import SanPhamPage from "./pages/SanPhamPage"; // 🟢 THÊM IMPORT NÀY

// RFQ Pages
import RFQHub from "./pages/rfq/RFQHub";
import BuyerDashboard from "./pages/rfq/buyer/BuyerDashboard";
import BuyerCreateRequest from "./pages/rfq/buyer/BuyerCreateRequest";
import BuyerRequestsList from "./pages/rfq/buyer/BuyerRequestsList";
import BuyerRequestDetail from "./pages/rfq/buyer/BuyerRequestDetail";
import SellerDashboard from "./pages/rfq/seller/SellerDashboard";
import SellerOpenRequests from "./pages/rfq/seller/SellerOpenRequests";
import SellerRequestDetail from "./pages/rfq/seller/SellerRequestDetail";
import SellerMyProposals from "./pages/rfq/seller/SellerMyProposals";

import Dashboard from "@/pages/Blockchain/Dashboard";
import Admin from "@/pages/Blockchain/Admin";
import ProfilePage from "./pages/ProfilePage";
import OrdersPage from "./pages/OrdersPage";
import KhuyenMaiPage from "./pages/KhuyenMaiPage";
import KhuyenMaiDaNhanPage from "./pages/KhuyenMaiDaNhanPage";
import QuanLyKhuyenMaiPage from "./pages/QuanLyKhuyenMaiPage";
// import ShipperDashboard from "./pages/ShipperDashboard";

import MyStoreRedirect from "./pages/MyStoreRedirect";

// ✅ Import PrivateRoute
import PrivateRoute from "./components/PrivateRoute";
import RFQMarketplace from "./pages/rfq/RFQMarketplace";

import ChatWidget from "./components/ai/ChatWidget";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminShops from "./pages/admin/AdminShops";
import AdminProducts from "./pages/admin/AdminProducts";
import EmployeeLayout from "./pages/employee/EmployeeLayout";
import ShipperDashboard from "./pages/employee/ShipperDashboard";
import WarehouseDashboard from "./pages/employee/WarehouseDashboard";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AddressProvider>
          {/* Toaster đặt 1 lần duy nhất */}
          <Toaster richColors />

          {/* Router chính */}
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />

              <Route path="/signupshop" element={<StoreRegistrationPage />} />
              <Route path="/viewshop" element={<StoreDetailsPage />} />

              <Route path="/product/:id" element={<ProductOverview />} />
              <Route path="/san-pham" element={<SanPhamPage />} />

              <Route path="/cuahang/:MaCH" element={<CuahangDetailPage />} />
              <Route path="/kenh-nguoi-ban" element={<MyStoreRedirect />} />

              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />

              <Route
                path="/order-success/:MaDH"
                element={<OrderSuccessPage />}
              />

              <Route path="/marketplace" element={<RFQHub />} />

              <Route path="/rfq" element={<RFQHub />}>
                <Route index element={<RFQMarketplace />} />

                <Route path="buyer" element={<BuyerDashboard />} />
                <Route path="buyer/create" element={<BuyerDashboard />} />

                {/* Danh sách & Chi tiết */}
                <Route path="buyer/requests" element={<BuyerRequestsList />} />
                <Route
                  path="buyer/requests/:MaYCDH"
                  element={<BuyerRequestDetail />}
                />

                {/* --- SELLER ROUTES --- */}
                <Route path="seller" element={<SellerDashboard />} />
                <Route
                  path="seller/requests"
                  element={<SellerOpenRequests />}
                />
                <Route
                  path="seller/requests/:MaYCDH"
                  element={<SellerRequestDetail />}
                />
                <Route
                  path="seller/proposals"
                  element={<SellerMyProposals />}
                />
              </Route>

              {/* User */}
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/orders" element={<OrdersPage />} />

              {/* Blockchain */}
              <Route path="/blockchain/dashboard" element={<Dashboard />} />
              <Route path="/blockchain/admin" element={<Admin />} />

              {/* Khuyến mãi */}
              <Route path="/khuyen-mai" element={<KhuyenMaiPage />} />
              <Route
                path="/khuyen-mai-da-nhan"
                element={<KhuyenMaiDaNhanPage />}
              />

              <Route
                path="/quan-ly-khuyen-mai"
                element={
                  <PrivateRoute allowedRoles={["Admin", "Cửa Hàng"]}>
                    <QuanLyKhuyenMaiPage />
                  </PrivateRoute>
                }
              />

              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />{" "}
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="shops" element={<AdminShops />} />
                <Route path="products" element={<AdminProducts />} />
              </Route>

              {/* 🔴 EMPLOYEE PORTAL ROUTES */}
              <Route path="/employee" element={<EmployeeLayout />}>
                {/* Route cho Shipper */}
                <Route path="shipper/tasks" element={<ShipperDashboard />} />
                <Route
                  path="shipper/map"
                  element={<div>Bản đồ giao hàng (Đang phát triển)</div>}
                />
                <Route
                  path="shipper/history"
                  element={<div>Lịch sử giao hàng</div>}
                />

                {/* Route cho Kho */}
                <Route
                  path="warehouse/import"
                  element={<WarehouseDashboard />}
                />
                <Route
                  path="warehouse/export"
                  element={<WarehouseDashboard />}
                />
                <Route
                  path="warehouse/inventory"
                  element={<WarehouseDashboard />}
                />

                {/* Redirect mặc định */}
                <Route
                  index
                  element={
                    <div className="p-8 text-center">
                      Vui lòng chọn chức năng trên menu
                    </div>
                  }
                />
              </Route>
              <Route
                path="/shipper"
                element={
                  <PrivateRoute allowedRoles={["Shipper"]}>
                    <ShipperDashboard />
                  </PrivateRoute>
                }
              />
            </Routes>

            <ChatWidget />
          </BrowserRouter>
        </AddressProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
