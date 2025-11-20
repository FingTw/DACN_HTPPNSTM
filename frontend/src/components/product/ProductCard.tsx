// src/components/product/ProductCard.tsx
import React, { useState } from "react";
import { Star, Heart, ShoppingCart, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

interface SanPham {
  MaSP: string;
  TenSP: string;
  GiaBan: number;
  SLTon: number;
  DVT: string;
  TrangThai: string;
  DiemDG_SP: number;
  SoLuongDanhGia_SP: number;
  MoTa?: string;
  hinhanhs?: { URL: string }[];
  cuahang?: { MaCH: string; TenCH: string };
  MaDM_danhmucs?: { MaDM: string; TenDM: string }[];
}

interface ProductCardProps {
  sanPham: SanPham;
}

const ProductCard: React.FC<ProductCardProps> = ({ sanPham }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [isAdding, setIsAdding] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // 👉 Format giá VND
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  // 👉 Lấy link hình ảnh
  const getImageUrl = (url?: string) => {
    if (!url) return "https://via.placeholder.com/400?text=No+Image";
    if (url.startsWith("http")) return url;
    if (url.startsWith("/uploads/")) return `http://localhost:3000${url}`;
    return url;
  };

  // 👉 Render ⭐ đánh giá
  const renderStars = (rating: number) =>
    [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));

  // 👉 View chi tiết
  const handleView = () => navigate(`/product/${sanPham.MaSP}`);

  // 👉 Add cart
  const handleAddCart = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) return toast.error("Vui lòng đăng nhập để mua hàng");
    if (sanPham.SLTon <= 0) return toast.error("Sản phẩm hết hàng");

    setIsAdding(true);
    try {
      await addToCart(sanPham.MaSP, 1);
      toast.success("Đã thêm vào giỏ hàng!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi thêm giỏ hàng");
    }
    setIsAdding(false);
  };

  const image = getImageUrl(sanPham.hinhanhs?.[0]?.URL);
  const stock = sanPham.SLTon;

  return (
    <div
      onClick={handleView}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden cursor-pointer 
      hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
    >
      {/* IMAGE */}
      <div className="relative h-48 bg-gradient-to-br from-emerald-50 to-teal-50 overflow-hidden">
        <img
          src={image}
          alt={sanPham.TenSP}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Trạng thái */}
        <span
          className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium shadow-md 
          ${
            sanPham.TrangThai === "Đang bán"
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {sanPham.TrangThai}
        </span>

        {/* Favorite */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all
          ${
            isFavorite ? "bg-red-500 text-white" : "bg-white/90 text-gray-600"
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
        </button>

        {/* Rating */}
        {sanPham.DiemDG_SP > 0 && (
          <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span>{sanPham.DiemDG_SP.toFixed(1)}</span>
          </div>
        )}

        {/* Stock */}
        <span
          className={`absolute bottom-3 right-3 px-2 py-1 rounded-full text-xs font-medium shadow-md 
          ${
            stock > 10
              ? "bg-blue-500 text-white"
              : stock > 0
              ? "bg-orange-500 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {stock > 0 ? `Còn ${stock} ${sanPham.DVT}` : "Hết hàng"}
        </span>
      </div>

      {/* INFO */}
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-emerald-700 transition-colors">
          {sanPham.TenSP}
        </h3>

        {/* Mô tả */}
        {sanPham.MoTa && (
          <p className="text-gray-600 text-sm line-clamp-2">{sanPham.MoTa}</p>
        )}

        {/* Danh mục */}
        {sanPham.MaDM_danhmucs && (
          <div className="flex gap-1 flex-wrap">
            {sanPham.MaDM_danhmucs.slice(0, 2).map((dm) => (
              <span
                key={dm.MaDM}
                className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs border"
              >
                {dm.TenDM}
              </span>
            ))}
            {sanPham.MaDM_danhmucs.length > 2 && (
              <span className="text-xs text-gray-500">
                +{sanPham.MaDM_danhmucs.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Cửa hàng */}
        {sanPham.cuahang && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/cuahang/${sanPham.cuahang?.MaCH}`);
            }}
            className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-800 cursor-pointer"
          >
            <Store className="w-4 h-4" />
            {sanPham.cuahang.TenCH}
          </div>
        )}

        {/* Price + Cart */}
        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-xl font-bold text-emerald-600">
              {formatPrice(sanPham.GiaBan)}
            </p>
          </div>

          <button
            onClick={handleAddCart}
            disabled={stock === 0 || isAdding}
            className={`p-2 rounded-xl transition-all ${
              stock === 0
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-gradient-to-r from-orange-500 to-red-500 hover:scale-105 text-white"
            }`}
          >
            {isAdding ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <ShoppingCart className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
