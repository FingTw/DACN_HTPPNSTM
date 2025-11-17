// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import HomePage from "./pages/HomePage";
import CartPage from "./pages/CartPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import { Toaster } from "sonner";
import StoreRegistrationPage from "./components/shop/StoreRegistrationPage";
import StoreDetailsPage from "./components/shop/StoreDetailPage";
import ProductOverview from "./components/product/ProductOverview";
import CuahangDetailPage from "./pages/CuahangDetailPage";
import { CartProvider } from "@/context/CartContext";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import { AddressProvider } from "@/context/AddressContext";
import { RequestsMarketplace } from "./pages/RequestsMarketplace";
import SanPhamPage from "./pages/SanPhamPage"; // 🟢 THÊM IMPORT NÀY

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AddressProvider>
          {" "}
          <Toaster richColors />
          <BrowserRouter>
            <Routes>
              {/* Public routes - ai cũng vào được */}
              <Route path="/" element={<HomePage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/signupshop" element={<StoreRegistrationPage />} />
              <Route path="/viewshop" element={<StoreDetailsPage />} />
              <Route path="/product/:id" element={<ProductOverview />} />

              <Route path="/marketplace" element={<RequestsMarketplace />} />
              {/* 🟢 THÊM ROUTE SẢN PHẨM */}
              <Route path="/san-pham" element={<SanPhamPage />} />

              {/* 🟢 THÊM ROUTE CỬA HÀNG */}
              <Route path="/cuahang/:MaCH" element={<CuahangDetailPage />} />

              <Route path="/cart" element={<CartPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route
                path="/order-success/:MaDH"
                element={<OrderSuccessPage />}
              />
              {/* Private routes - thêm sau */}
              {/* <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} /> */}
            </Routes>
          </BrowserRouter>
        </AddressProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
