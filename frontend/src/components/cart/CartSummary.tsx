// src/components/cart/CartSummary.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface CartProduct {
  MaSP: string;
  TenSP: string;
  GiaBan: number;
  SLTon: number;
  HinhAnh?: string;
}

interface CartItemType {
  MaSP: string;
  SL: number;
  TongTien: number;
  MaSP_sanpham: CartProduct;
}

interface CartSummaryProps {
  items: CartItemType[];
  total: number;
  selectedItems: string[];
  selectedTotal: number;
  selectedCount: number;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  items,
  total,
  selectedItems,
  selectedTotal,
  selectedCount,
}) => {
  const navigate = useNavigate(); // ← THÊM HOOK NÀY
  const shippingFee = 30000;

  // ✅ Đảm bảo các giá trị là number
  const numericTotal = Number(total) || 0;
  const numericSelectedTotal = Number(selectedTotal) || 0;

  // ✅ Chọn giá trị hiển thị
  const displayTotal = selectedCount > 0 ? numericSelectedTotal : numericTotal;
  const displayCount = selectedCount > 0 ? selectedCount : items.length;
  const finalTotal = displayTotal + (selectedCount > 0 ? shippingFee : 0);

  // ✅ Hàm format chuẩn VND
  const formatVND = (value: number) =>
    value.toLocaleString('vi-VN');

  // ✅ HÀM XỬ LÝ CHUYỂN TRANG THANH TOÁN
  const handleCheckout = () => {
    if (selectedCount === 0) return;

    // Lọc các sản phẩm được chọn
    const selectedProducts = items.filter(item => 
      selectedItems.includes(item.MaSP)
    );

    // ✅ SỬA: ĐẢM BẢO TÍNH TOÁN NHẤT QUÁN
    const subtotal = selectedProducts.reduce((total, item) => 
      total + (item.TongTien || 0), 0
    );
    const shippingFee = 30000; // Fixed shipping fee
    const totalAmount = subtotal + shippingFee;

    console.log('🛒 CHECKOUT DATA CALCULATION:', {
      selectedProducts: selectedProducts.length,
      subtotal,
      shippingFee,
      totalAmount
    });

    // Chuyển đến trang checkout với dữ liệu
    navigate('/checkout', {
      state: {
        selectedItems: selectedProducts,
        totalAmount: totalAmount,
        shippingFee: selectedCount > 0 ? shippingFee : 0
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 sticky top-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tổng Đơn Hàng</h3>

      <div className="space-y-3 mb-6">
        {selectedCount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
            <p className="text-green-800 text-sm font-medium">
              Đang chọn {selectedCount} sản phẩm để thanh toán
            </p>
          </div>
        )}

        <div className="flex justify-between text-gray-600">
          <span>Tạm tính ({displayCount} sản phẩm)</span>
          <span className="font-medium">{formatVND(displayTotal)}đ</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Phí vận chuyển</span>
          <span className="font-medium">
            {selectedCount > 0 ? formatVND(shippingFee) : '0'}đ
          </span>
        </div>

        <hr className="my-2" />

        <div className="flex justify-between text-lg font-bold text-gray-900">
          <span>Tổng cộng</span>
          <span className="text-green-600">{formatVND(finalTotal)}đ</span>
        </div>
      </div>

      {/* ✅ NÚT ĐÃ ĐƯỢC THÊM SỰ KIỆN CLICK */}
      <button
        onClick={handleCheckout} // ← THÊM SỰ KIỆN NÀY
        className={`w-full py-3 rounded-lg font-semibold transition-colors mb-4 ${
          selectedCount > 0
            ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        disabled={selectedCount === 0}
      >
        {selectedCount > 0
          ? `Tiến Hành Thanh Toán (${selectedCount} sản phẩm)`
          : 'Vui lòng chọn sản phẩm'}
      </button>

      <Link
        to="/"
        className="block text-center text-green-600 hover:text-green-700 font-medium transition-colors py-2 hover:bg-green-50 rounded-lg"
      >
        ← Tiếp tục mua sắm
      </Link>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg
            className="w-4 h-4 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <span>Đảm bảo chất lượng 100%</span>
        </div>
      </div>
    </div>
  );
};