// src/components/cart/CartItem.tsx
import React from "react";

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
  MaSP_sanpham?: CartProduct; // Thêm optional vì có thể undefined
}

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (MaSP: string, quantity: number) => void;
  onRemove: (MaSP: string) => void;
  isSelected: boolean;
  onSelect: (MaSP: string, checked: boolean) => void;
}

export const CartItem = React.memo<CartItemProps>(
  ({ item, onUpdateQuantity, onRemove, isSelected, onSelect }) => {
    // Kiểm tra item và MaSP_sanpham có tồn tại không
    if (!item || !item.MaSP_sanpham) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="text-center text-gray-500">
            Sản phẩm không khả dụng
          </div>
        </div>
      );
    }

    const { MaSP, SL, TongTien, MaSP_sanpham } = item;

    const handleQuantityChange = (newQuantity: number) => {
      if (newQuantity >= 1 && newQuantity <= MaSP_sanpham.SLTon) {
        onUpdateQuantity(MaSP, newQuantity);
      }
    };

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-start gap-4 w-full">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(MaSP, e.target.checked)}
            className="w-5 h-5 mt-1"
          />

          {/* Ảnh */}
          <img
            src={MaSP_sanpham.HinhAnh || "/productdefaut.jpg"}
            className="w-24 h-24 object-cover rounded-lg"
          />

          {/* INFO + Quantity: Cột trái */}
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-gray-900 text-lg">
              {MaSP_sanpham.TenSP}
            </h3>

            <p className="text-green-600 font-bold text-xl">
              {MaSP_sanpham.GiaBan?.toLocaleString("vi-VN")}đ
            </p>

            {/* Quantity */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleQuantityChange(SL - 1)}
                disabled={SL <= 1}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
              >
                -
              </button>

              <span className="w-10 text-center text-lg">{SL}</span>

              <button
                onClick={() => handleQuantityChange(SL + 1)}
                disabled={SL >= (MaSP_sanpham.SLTon || 0)}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* CỘT PHẢI: Tổng + Xóa */}
          <div className="flex flex-col items-end justify-between flex-1">
            <span className="text-gray-900 font-semibold text-lg">
              Tổng: {TongTien.toLocaleString("vi-VN")}đ
            </span>

            <button
              onClick={() => onRemove(MaSP)}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Xóa
            </button>
          </div>
        </div>
      </div>
    );
  }
);
