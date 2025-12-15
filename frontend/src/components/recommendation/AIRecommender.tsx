// src/components/recommendation/AIRecommender.tsx
import React, { useEffect, useState } from "react";
import {
  getRecommendations,
  type RecommendationResult,
} from "@/services/recommendationService";
import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";

interface Product {
  MaSP: string;
  TenSP: string;
  GiaBan: number;
  HinhAnh?: string;
  SLTon?: number;
}

interface AIRecommenderProps {
  allProducts: Product[];
}

// Hàm helper xử lý ảnh
const getImageUrl = (url?: string) => {
  if (!url) return "/images/default-product.jpg";
  if (url.startsWith("http")) return url;
  // 🟢 QUAN TRỌNG: Nối domain backend vào đường dẫn tương đối
  return `http://localhost:3000${url.startsWith("/") ? url : `/${url}`}`;
};

export const AIRecommender: React.FC<AIRecommenderProps> = ({
  allProducts,
}) => {
  const { cartItems, addToCart } = useCart();
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchAI = async () => {
      if (cartItems.length === 0 || allProducts.length === 0) {
        setIsVisible(false);
        return;
      }

      setLoading(true);

      try {
        const cartNames = cartItems.map((item) => item.MaSP_sanpham.TenSP);
        const aiResults = await getRecommendations(cartNames);

        if (!aiResults || aiResults.length === 0) {
          setIsVisible(false);
          setLoading(false);
          return;
        }

        const mappedProducts = aiResults
          .map((res: RecommendationResult) => {
            return allProducts.find((p) =>
              p.TenSP.toLowerCase().includes(res.product.toLowerCase())
            );
          })
          .filter((p): p is Product => p !== undefined);

        const finalSuggestions = mappedProducts.filter(
          (p) => !cartItems.some((cartItem) => cartItem.MaSP === p.MaSP)
        );

        if (finalSuggestions.length > 0) {
          setSuggestions(finalSuggestions.slice(0, 4));
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      } catch (error) {
        console.error("AI Component Error:", error);
        setIsVisible(false);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchAI();
    }, 1000);

    return () => clearTimeout(timer);
  }, [cartItems, allProducts]);

  if (!isVisible) return null;

  return (
    <div className="mt-8 pt-8 border-t border-dashed border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-full text-white shadow-lg shadow-emerald-200">
          <span className="text-xl">✨</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            Có thể bạn cũng thích
          </h3>
          <p className="text-xs text-gray-500">
            Gợi ý dựa trên giỏ hàng hiện tại của bạn
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-xl h-48 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {suggestions.map((sp) => (
            <div
              key={sp.MaSP}
              className="group bg-white rounded-xl border border-gray-100 p-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-gray-50">
                <img
                  src={getImageUrl(sp.HinhAnh)} // 🟢 Dùng hàm fix ảnh ở đây
                  alt={sp.TenSP}
                  className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src = "/images/default-product.jpg";
                  }}
                />
                {/* Badge giảm giá hoặc tag nếu có thể thêm vào đây */}
              </div>

              <div className="space-y-2">
                <Link
                  to={`/product/${sp.MaSP}`}
                  className="block text-sm font-medium text-gray-700 hover:text-emerald-600 line-clamp-2 min-h-[2.5rem]"
                  title={sp.TenSP}
                >
                  {sp.TenSP}
                </Link>

                <div className="flex items-center justify-between">
                  <span className="text-emerald-600 font-bold text-sm">
                    {sp.GiaBan.toLocaleString("vi-VN")}đ
                  </span>

                  <button
                    onClick={() => addToCart(sp.MaSP, 1)}
                    disabled={(sp.SLTon || 0) <= 0}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Thêm nhanh vào giỏ"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
