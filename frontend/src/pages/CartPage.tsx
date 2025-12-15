// src/pages/CartPage.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AIRecommender } from "@/components/recommendation/AIRecommender";
import type { Product } from "@/services/productService";
import axios from "axios";

export const CartPage: React.FC = () => {
  const { user } = useAuth();
  const { cartItems, cartTotal, fetchCart, updateQuantity, removeFromCart } =
    useCart();
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadCart = async () => {
      setLoading(true);
      await fetchCart();
      try {
        const res = await axios.get(
          "http://localhost:3000/api/sanpham/all-for-ai"
        );
        if (res.data) {
          setAllProducts(
            Array.isArray(res.data) ? res.data : res.data.data || []
          );
        }
      } catch (error) {
        console.warn("Không tải được danh sách sản phẩm cho AI");
      }
      setLoading(false);
    };

    if (user) loadCart();
    else setLoading(false);
  }, [user]);

  // Logic chọn sản phẩm...
  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedItems(cartItems.map((item) => item.MaSP));
    else setSelectedItems([]);
  };

  const handleSelectItem = (MaSP: string, checked: boolean) => {
    if (checked) setSelectedItems((prev) => [...prev, MaSP]);
    else setSelectedItems((prev) => prev.filter((id) => id !== MaSP));
  };

  const calculateSelectedTotal = () => {
    return cartItems
      .filter((item) => selectedItems.includes(item.MaSP))
      .reduce((total, item) => total + (Number(item.TongTien) || 0), 0);
  };

  const handleUpdateQuantity = async (MaSP: string, newQuantity: number) => {
    try {
      await updateQuantity(MaSP, newQuantity);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRemoveItem = async (MaSP: string) => {
    if (!confirm("Xóa sản phẩm này?")) return;
    try {
      await removeFromCart(MaSP);
      setSelectedItems((prev) => prev.filter((id) => id !== MaSP));
      toast.success("Đã xóa");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedItems.length === 0) return;
    if (!confirm(`Xóa ${selectedItems.length} sản phẩm?`)) return;
    try {
      for (const MaSP of selectedItems) await removeFromCart(MaSP);
      setSelectedItems([]);
      toast.success("Đã xóa các sản phẩm chọn");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <img
          src="/images/empty-cart.png"
          alt="Login required"
          className="w-48 mb-6 opacity-50"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Bạn chưa đăng nhập
        </h2>
        <p className="text-gray-500 mb-6">
          Vui lòng đăng nhập để xem giỏ hàng của bạn
        </p>
        <Link
          to="/signin"
          className="bg-emerald-600 text-white px-8 py-3 rounded-full hover:bg-emerald-700 transition-shadow shadow-lg shadow-emerald-200"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Header />

      <main className="flex-1 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Giỏ Hàng</h1>

          {cartItems.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🛒</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Giỏ hàng trống
              </h2>
              <p className="text-gray-500 mb-8">
                Chưa có sản phẩm nào được chọn.
              </p>
              <Link
                to="/"
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-emerald-600 hover:bg-emerald-700 md:py-4 md:text-lg md:px-10 shadow-lg shadow-emerald-200 transition-all hover:-translate-y-1"
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          ) : (
            // 🟢 BỐ CỤC CHÍNH: GRID 12 CỘT
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-6">
                {/* Header Control */}
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center justify-between ">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        selectedItems.length === cartItems.length &&
                        cartItems.length > 0
                          ? "bg-emerald-600 border-emerald-600"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={
                          selectedItems.length === cartItems.length &&
                          cartItems.length > 0
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                      {selectedItems.length === cartItems.length &&
                        cartItems.length > 0 && (
                          <svg
                            className="w-3.5 h-3.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                    </div>
                    <span className="font-medium text-gray-700">
                      Tất cả ({cartItems.length})
                    </span>
                  </label>

                  {selectedItems.length > 0 && (
                    <button
                      onClick={handleRemoveSelected}
                      className="text-red-500 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Xóa ({selectedItems.length})
                    </button>
                  )}
                </div>

                {/* Product List */}
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <CartItem
                      key={`${item.MaGH}-${item.MaSP}`}
                      item={item}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemove={handleRemoveItem}
                      isSelected={selectedItems.includes(item.MaSP)}
                      onSelect={handleSelectItem}
                    />
                  ))}
                </div>

                {/* 🤖 KHỐI AI NẰM DƯỚI DANH SÁCH SẢN PHẨM */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  <AIRecommender allProducts={allProducts} />
                </div>
              </div>

              {/* 🟢 CỘT PHẢI (CHIẾM 4/12) - TỔNG KẾT - STICKY */}
              <div className="lg:col-span-4 sticky top-24">
                <CartSummary
                  items={cartItems}
                  total={cartTotal}
                  selectedItems={selectedItems}
                  selectedTotal={calculateSelectedTotal()}
                  selectedCount={selectedItems.length}
                />

                {/* Trust Badges */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-100 text-center">
                    <span className="text-2xl mb-1">🛡️</span>
                    <span className="text-xs font-medium text-gray-500">
                      Bảo mật 100%
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-100 text-center">
                    <span className="text-2xl mb-1">⚡</span>
                    <span className="text-xs font-medium text-gray-500">
                      Giao siêu tốc
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CartPage;
