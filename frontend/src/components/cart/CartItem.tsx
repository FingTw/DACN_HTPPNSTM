// src/components/cart/CartItem.tsx
import React from 'react';

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

export const CartItem = React.memo<CartItemProps>(({ 
  item, 
  onUpdateQuantity, 
  onRemove, 
  isSelected,
  onSelect 
}) => {
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
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex gap-4">
        {/* Checkbox */}
        <div className="flex items-start">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(MaSP, e.target.checked)}
            className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500 mt-1"
          />
        </div>

        {/* Hình ảnh sản phẩm */}
        <div className="flex-shrink-0">
          <img
            src={MaSP_sanpham.HinhAnh || '/placeholder-product.jpg'}
            alt={MaSP_sanpham.TenSP}
            className="w-24 h-24 object-cover rounded-lg"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-product.jpg';
            }}
          />
        </div>

        {/* Thông tin sản phẩm */}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2 text-lg">
            {MaSP_sanpham.TenSP || 'Tên sản phẩm'}
          </h3>
          <p className="text-green-600 font-bold text-xl mb-3">
            {MaSP_sanpham.GiaBan?.toLocaleString('vi-VN') || '0'}đ
          </p>

          {/* Điều chỉnh số lượng */}
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => handleQuantityChange(SL - 1)}
              disabled={SL <= 1}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              -
            </button>
            <span className="w-12 text-center font-medium text-lg">{SL}</span>
            <button
              onClick={() => handleQuantityChange(SL + 1)}
              disabled={SL >= (MaSP_sanpham.SLTon || 0)}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              +
            </button>
          </div>

          {/* Tổng tiền và xóa */}
          <div className="flex items-center justify-between">
            <span className="text-gray-900 font-semibold text-lg">
              Tổng: {TongTien?.toLocaleString('vi-VN') || '0'}đ
            </span>
            <button
              onClick={() => onRemove(MaSP)}
              className="text-red-600 hover:text-red-700 font-medium hover:bg-red-50 px-3 py-1 rounded transition-colors"
            >
              Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});