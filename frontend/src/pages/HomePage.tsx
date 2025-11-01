// src/pages/HomePage.tsx

import React from "react"; // Đảm bảo React được import
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

// Khai báo component như một hàm bình thường
const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        // Đảm bảo productService.getFeaturedProducts() có tồn tại và trả về đúng kiểu Product[]
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex flex-1 ">
        {/* Sidebar - Fixed position */}
        <aside className="w-64 flex-shrink-0">
          <div className="sticky top-0">
            <SidebarCategory />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-gray-100 flex flex-col space-y-4 p-2">
          <div className="card rounded-xl bg-white p-2 ">
            <BannerCarousel />
          </div>

          <div className="bg-gray-100 p-2 ">
            <HeroSection />
          </div>

          <div className="bg-gray-100 p-2 ">
            <ShopList />
          </div>

          {loading ? (
            <div className="text-center py-8">Đang tải sản phẩm...</div>
          ) : (
            <ProductList products={featuredProducts} title="Gợi ý hôm nay" />
          )}

          {/* Featured Products Section */}
          <section className="py-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center mb-12">
                Featured Products
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center p-8 border border-gray-200 rounded-lg bg-white">
                  <p className="text-gray-500">Product cards coming soon...</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default HomePage;
