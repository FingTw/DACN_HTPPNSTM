// src/pages/HomePage.tsx
import React from "react";
import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/home/HeroSection";
import { Footer } from "@/components/layout/Footer";
import SidebarCategory from "@/components/layout/SidebarCategory";
import BannerCarousel from "@/components/home/Banner";
import { ProductList } from "@/components/home/ProductList";
import { productService } from "@/services/productService";
import { useState, useEffect } from "react";
import type { Product } from "@/services/productService";
import ShopList from "@/components/home/ShopList";
import { useNavigate } from "react-router-dom";

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Debug: kiểm tra navigate có hoạt động không
  useEffect(() => {
    console.log("🔍 DEBUG: HomePage mounted");
    console.log("🔍 DEBUG: useNavigate hook:", navigate);
  }, [navigate]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await productService.getFeaturedProducts();
        setFeaturedProducts(data);
      } catch (err) {
        console.error("Lỗi load sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Hàm xử lý khi click vào nút "Xem tất cả sản phẩm"
  const handleViewAllProducts = () => {
    console.log("🔄 DEBUG: Đang click vào nút Xem tất cả sản phẩm");
    console.log("📍 DEBUG: Current path:", window.location.pathname);

    try {
      navigate("/san-pham");
      console.log("✅ DEBUG: Navigate function được gọi");
    } catch (error) {
      console.error("❌ DEBUG: Lỗi navigate:", error);
      // Fallback nếu navigate không hoạt động
      window.location.href = "/san-pham";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex flex-1">
        {/* Sidebar - Fixed position */}
        <aside className="w-64 flex-shrink-0">
          <div className="sticky top-0">
            <SidebarCategory />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-gray-100 flex flex-col space-y-4 p-2">
          <div className="card rounded-xl bg-white p-2">
            <BannerCarousel />
          </div>

          <div className="bg-gray-100 p-2">
            <HeroSection />
          </div>

          <div className="bg-gray-100 p-2">
            <ShopList />
          </div>

          {/* Phần Gợi ý hôm nay với nút Xem tất cả */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Gợi ý hôm nay
              </h2>
              <button
                onClick={handleViewAllProducts}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <span>Xem tất cả sản phẩm</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                <p className="mt-2 text-gray-600">Đang tải sản phẩm...</p>
              </div>
            ) : (
              <ProductList products={featuredProducts} />
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default HomePage;
