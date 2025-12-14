// src/components/ChatProductCard.tsx
import React from "react";
import { Link } from "react-router-dom";

// Định nghĩa kiểu dữ liệu cho sản phẩm trong chat
export interface ChatProduct {
  MaSP: string;
  TenSP: string;
  GiaBan: number;
  HinhAnh: string;
}

interface ChatProductCardProps {
  product: ChatProduct;
}

const ChatProductCard: React.FC<ChatProductCardProps> = ({ product }) => {
  // Hàm format tiền tệ
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Xử lý đường dẫn ảnh (nếu ảnh lưu local)
  const getImageUrl = (url: string) => {
    if (!url) return "https://via.placeholder.com/150";
    if (url.startsWith("http")) return url;
    return `http://localhost:3000${url.startsWith("/") ? url : `/${url}`}`;
  };

  return (
    <Link
      to={`/product/${product.MaSP}`} // Đường dẫn tới trang chi tiết sản phẩm
      className="block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow max-w-[220px] mt-2 transition-transform hover:scale-[1.02]"
    >
      <div className="relative h-32 w-full bg-white">
        <img
          src={getImageUrl(product.HinhAnh)}
          alt={product.TenSP}
          className="w-full h-full object-contain p-2 rounded-xl"
        />
      </div>
      <div className="p-3">
        <h4 className="font-medium text-gray-800 text-sm line-clamp-2 mb-1">
          {product.TenSP}
        </h4>
        <div className="text-emerald-600 font-bold text-sm">
          {formatCurrency(product.GiaBan)}
        </div>
        <div className="mt-2 text-xs text-center bg-emerald-50 text-emerald-700 py-1 rounded">
          Xem chi tiết
        </div>
      </div>
    </Link>
  );
};

export default ChatProductCard;
