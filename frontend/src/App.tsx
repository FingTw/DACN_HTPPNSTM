// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import HomePage from "./pages/HomePage";
import { Toaster } from "sonner";
import StoreRegistrationPage from "./components/shop/StoreRegistrationPage";
import StoreDetailsPage from "./components/shop/StoreDetailPage";
import ProductOverview from "./components/product/ProductOverview";
import CuahangDetailPage from "./pages/CuahangDetailPage"; // 🟢 THÊM IMPORT NÀY

function App() {
  return (
    <AuthProvider>
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

          {/* 🟢 THÊM ROUTE CỬA HÀNG */}
          <Route path="/cuahang/:MaCH" element={<CuahangDetailPage />} />

          {/* Private routes - thêm sau */}
          {/* <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} /> */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
