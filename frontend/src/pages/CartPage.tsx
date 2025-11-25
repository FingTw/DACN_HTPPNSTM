import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const CartPage: React.FC = () => {
  const { user } = useAuth();
  const { cartItems, cartTotal, fetchCart, updateQuantity, removeFromCart } =
    useCart();
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Load giỏ hàng khi vào trang
  useEffect(() => {
    const loadCart = async () => {
      setLoading(true);
      await fetchCart();
      setLoading(false);
    };

    if (user) {
      loadCart();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Chọn/Bỏ chọn tất cả
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(cartItems.map((item) => item.MaSP));
    } else {
      setSelectedItems([]);
    }
  };

  // Chọn/Bỏ chọn từng sản phẩm
  const handleSelectItem = (MaSP: string, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, MaSP]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== MaSP));
    }
  };

  // Tính tổng tiền các sản phẩm được chọn
  const calculateSelectedTotal = () => {
    const total = cartItems
      .filter((item) => selectedItems.includes(item.MaSP))
      .reduce((total, item) => {
        // Đảm bảo TongTien là number
        const itemTotal = Number(item.TongTien) || 0;
        console.log(
          `Item ${item.MaSP}: TongTien=${item.TongTien}, Parsed=${itemTotal}`
        );
        return total + itemTotal;
      }, 0);

    console.log("Calculated Selected Total:", total);
    return total;
  };

  // Tính số lượng sản phẩm được chọn
  const selectedCount = selectedItems.length;

  // Cập nhật số lượng
  const handleUpdateQuantity = async (MaSP: string, newQuantity: number) => {
    try {
      await updateQuantity(MaSP, newQuantity);
      toast.success("Đã cập nhật số lượng");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Xóa sản phẩm
  const handleRemoveItem = async (MaSP: string) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

    try {
      await removeFromCart(MaSP);
      setSelectedItems((prev) => prev.filter((id) => id !== MaSP));
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Xóa nhiều sản phẩm
  const handleRemoveSelected = async () => {
    if (selectedItems.length === 0) {
      toast.error("Vui lòng chọn sản phẩm để xóa");
      return;
    }

    if (!confirm(`Bạn có chắc muốn xóa ${selectedItems.length} sản phẩm?`))
      return;

    try {
      for (const MaSP of selectedItems) {
        await removeFromCart(MaSP);
      }
      setSelectedItems([]);
      toast.success(`Đã xóa ${selectedItems.length} sản phẩm`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Vui lòng đăng nhập để xem giỏ hàng
            </h2>
            <Link
              to="/signin"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-white rounded-lg shadow-sm p-6 mb-4"
              >
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Giỏ Hàng Của Tôi
          </h1> */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Danh sách sản phẩm */}
            <div className="lg:col-span-4 flex justify-center">
              {cartItems.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg
                      className="w-24 h-24 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Giỏ hàng trống
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Hãy thêm sản phẩm để bắt đầu mua sắm!
                  </p>
                  <Link
                    to="/"
                    className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Tiếp tục mua sắm
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Header với chọn tất cả */}
                  <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            selectedItems.length === cartItems.length &&
                            cartItems.length > 0
                          }
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
                        />
                        <span className="font-medium text-gray-900">
                          Chọn tất cả ({cartItems.length} sản phẩm)
                        </span>
                      </label>

                      {selectedItems.length > 0 && (
                        <button
                          onClick={handleRemoveSelected}
                          className="text-red-600 hover:text-red-700 font-medium text-sm"
                        >
                          Xóa đã chọn ({selectedItems.length})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Danh sách sản phẩm với checkbox */}
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
              )}
            </div>

            {/* Tổng kết đơn hàng */}
            {cartItems.length > 0 && (
              <div className="lg:col-span-1">
                <CartSummary
                  items={cartItems}
                  total={cartTotal}
                  selectedItems={selectedItems}
                  selectedTotal={calculateSelectedTotal()}
                  selectedCount={selectedCount}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CartPage;
