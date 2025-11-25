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

// ✅ Import PrivateRoute
import PrivateRoute from "./components/PrivateRoute";
import RFQMarketplace from "./pages/rfq/RFQMarketplace";

import ChatWidget from "./components/ai/ChatWidget";

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

              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />

              <Route
                path="/order-success/:MaDH"
                element={<OrderSuccessPage />}
              />

              <Route path="/marketplace" element={<RFQHub />} />

              {/* RFQ Layout Route: Tất cả đường dẫn bắt đầu bằng /rfq sẽ đi qua RFQHub */}
              <Route path="/rfq" element={<RFQHub />}>
                {/* --- BUYER ROUTES (Lưu ý: không cần thêm /rfq ở đầu path nữa) --- */}
                <Route index element={<RFQMarketplace />} />

                {/* Dashboard chính & Modal tạo yêu cầu (chung 1 component để giữ layout) */}
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
            </Routes>

            <ChatWidget />
          </BrowserRouter>
        </AddressProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
