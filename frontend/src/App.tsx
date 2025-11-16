// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext"; 
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import HomePage from "./pages/HomePage";
import CartPage from './pages/CartPage';
import ProductDetailPage from './pages/ProductDetailPage';
import { Toaster } from "sonner";
import StoreRegistrationPage from "./components/shop/StoreRegistrationPage";
import StoreDetailsPage from "./components/shop/StoreDetailPage";
import ProductOverview from "./components/product/ProductOverview";
import { CartProvider } from "@/context/CartContext";
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import { AddressProvider } from "@/context/AddressContext";
import Dashboard from "@/pages/Blockchain/Dashboard";
import Admin from "@/pages/Blockchain/Admin";
import ProfilePage from "./pages/ProfilePage";
import OrdersPage from "./pages/OrdersPage";
import KhuyenMaiPage from './pages/KhuyenMaiPage';
import KhuyenMaiDaNhanPage from './pages/KhuyenMaiDaNhanPage';
import QuanLyKhuyenMaiPage from './pages/QuanLyKhuyenMaiPage';

// ✅ Import PrivateRoute
import PrivateRoute from './components/PrivateRoute';


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
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/signupshop" element={<StoreRegistrationPage />} />
          <Route path="/viewshop" element={<StoreDetailsPage />} />
          <Route path="/product/:id" element={<ProductOverview />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success/:MaDH" element={<OrderSuccessPage />} />
          <Route path="/blockchain/dashboard" element={<Dashboard />} />
          <Route path="/blockchain/admin" element={<Admin />} />
          <Route path="/khuyen-mai" element={<KhuyenMaiPage />} />
          <Route path="/khuyen-mai-da-nhan" element={<KhuyenMaiDaNhanPage />} />
          <Route path="/quan-ly-khuyen-mai" element={<QuanLyKhuyenMaiPage />} />
          {/* Private routes - thêm sau */}
          {/* <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} /> */}
          <Route 
            path="/quan-ly-khuyen-mai" 
            element={
              <PrivateRoute allowedRoles={['Admin', 'Cửa Hàng']}>
                <QuanLyKhuyenMaiPage />
              </PrivateRoute>
            } 
          />    
        </Routes>
      </BrowserRouter>
      </AddressProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
