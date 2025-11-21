// src/components/cart/CartItem.tsx
import React from "react";

interface CartProduct {
  MaSP: string;
  TenSP: string;
  GiaBan: number;
  SLTon: number;
  // Cập nhật interface cho đúng cấu trúc mảng hình ảnh
  hinhanhs?: Array<{
    MaHA?: string;
    URL: string;
  }>;
}

interface CartItemType {
  MaSP: string;
  SL: number;
  TongTien: number;
  MaSP_sanpham?: CartProduct;
}

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (MaSP: string, quantity: number) => void;
  onRemove: (MaSP: string) => void;
  isSelected: boolean;
  onSelect: (MaSP: string, checked: boolean) => void;
}

// Hàm xử lý URL ảnh
const getImageUrl = (url?: string) => {
  if (!url) return "/productdefaut.jpg"; // Ảnh mặc định nếu URL rỗng
  if (url.startsWith("http")) return url; // Ảnh online
  // Nối domain backend nếu là đường dẫn tương đối
  return `http://localhost:3000${url.startsWith("/") ? url : `/${url}`}`;
};

export const CartItem = React.memo<CartItemProps>(
  ({ item, onUpdateQuantity, onRemove, isSelected, onSelect }) => {
    // Kiểm tra item và sản phẩm có tồn tại không
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

    // Lấy ảnh đầu tiên từ mảng hinhanhs
    const images = MaSP_sanpham.hinhanhs || [];
    const mainImage =
      images.length > 0 ? getImageUrl(images[0].URL) : "/productdefaut.jpg";

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
            className="w-5 h-5 mt-1 accent-green-600 cursor-pointer"
          />

          {/* Ảnh sản phẩm */}
          <div className="flex-shrink-0">
            <img
              src={mainImage}
              alt={MaSP_sanpham.TenSP}
              className="w-24 h-24 object-cover rounded-lg border border-gray-200"
              onError={(e) => {
                e.currentTarget.src = "/productdefaut.jpg";
              }}
            />
          </div>

          {/* Thông tin sản phẩm + Số lượng */}
          <div className="flex flex-col gap-2 flex-1">
            <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">
              {MaSP_sanpham.TenSP}
            </h3>

            <p className="text-green-600 font-bold text-xl">
              {MaSP_sanpham.GiaBan?.toLocaleString("vi-VN")}đ
            </p>

            {/* Bộ điều chỉnh số lượng */}
            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={() => handleQuantityChange(SL - 1)}
                disabled={SL <= 1}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                -
              </button>

              <span className="w-10 text-center text-lg font-medium">{SL}</span>

              <button
                onClick={() => handleQuantityChange(SL + 1)}
                disabled={SL >= (MaSP_sanpham.SLTon || 0)}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Cột phải: Tổng tiền + Nút xóa */}
          <div className="flex flex-col items-end justify-between h-24">
            <span className="text-gray-900 font-bold text-lg">
              {TongTien.toLocaleString("vi-VN")}đ
            </span>

            <button
              onClick={() => onRemove(MaSP)}
              className="text-red-500 hover:text-red-700 font-medium text-sm hover:underline transition-colors"
            >
              Xóa
            </button>
          </div>
        </div>
      </div>
    );
  }
);
