// // ProductCard.tsx
// import React from "react";
// import { Link } from "react-router-dom";
// import type { Product } from "@/services/productService";

// interface ProductCardProps {
//   product: Product;
// }

// export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
//   const mainImage = product.hinhanhs?.[0]?.URL || "/productdefaut.jpg";
//   const rating = product.DiemDG_SP || 0;
//   const reviewCount = product.danhgias?.length || 0;

//   return (
//     <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300  transition-transform duration-500 hover:scale-105">
//       <Link to={`/product/${product.MaSP}`}>
//         <div className="relative">
//           <img
//             className="p-8 rounded-t-lg w-full h-64 object-contain bg-gray-50"
//             src={mainImage}
//             alt={product.TenSP}
//             loading="lazy"
//           />
//           {/* AD Badge */}
//           <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
//             AD
//           </span>
//         </div>
//       </Link>

//       <div className="px-5 pb-5">
//         <Link to={`/product/${product.MaSP}`}>
//           <h5 className="text-xl font-semibold tracking-tight text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
//             {product.TenSP}
//           </h5>
//         </Link>

//         {/* Origin & Short Description */}
//         <p className="text-sm text-gray-500 mt-1 line-clamp-1">
//           {product.NguonGoc} • {product.MoTa?.substring(0, 60)}...
//         </p>

//         {/* Rating */}
//         <div className="flex items-center mt-2.5 mb-3">
//           <div className="flex items-center space-x-1">
//             {[1, 2, 3, 4, 5].map((star) => (
//               <svg
//                 key={star}
//                 className={`w-4 h-4 ${
//                   star <= Math.floor(rating)
//                     ? "text-yellow-400 fill-yellow-400"
//                     : "text-gray-200 fill-gray-200"
//                 }`}
//                 viewBox="0 0 22 20"
//                 fill="currentColor"
//               >
//                 <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
//               </svg>
//             ))}
//           </div>
//           <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded ms-3">
//             {rating > 0 ? rating.toFixed(1) : "Chưa có"}
//           </span>
//           <span className="text-xs text-gray-500 ms-2">
//             ({reviewCount} đánh giá)
//           </span>
//         </div>

//         {/* Price & Button */}
//         <div className="flex items-center justify-between mt-4">
//           <div>
//             <span className="text-3xl font-bold text-gray-900">
//               {product.GiaBan.toLocaleString("vi-VN")}₫
//             </span>
//           </div>
//           <button
//             // Bỏ ml-2 nếu muốn gần hơn, hoặc giữ để có khoảng cách
//             className="ml-2 text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-full p-2.5 text-center transition-colors
//                    **flex items-center justify-center**" // Thêm flex để căn giữa icon
//             title="Thêm vào giỏ" // Rất quan trọng để người dùng biết chức năng của icon
//           >
//             {/* ICON GIỎ HÀNG SVG - Bạn có thể thay bằng icon từ thư viện của mình */}
//             <svg
//               className="w-5 h-5" // Kích thước icon
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth="2"
//                 d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
//               ></path>
//             </svg>
//           </button>
//         </div>

//         {/* Tags */}
//         <div className="flex gap-2 mt-3 text-xs">
//           <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded">
//             Giao nhanh 2h
//           </span>
//           <span className="bg-green-100 text-green-600 px-2 py-1 rounded">
//             Chính hãng
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// };
// ProductCard.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import type { Product } from "@/services/productService";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isAdding, setIsAdding] = useState(false);
  const { user } = useAuth();
  const { addToCart } = useCart();
  
  const mainImage = product.hinhanhs?.[0]?.URL || "/productdefaut.jpg";
  const rating = product.DiemDG_SP || 0;
  const reviewCount = product.danhgias?.length || 0;
  const isOutOfStock = product.SLTon <= 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng");
      return;
    }

    if (isOutOfStock) {
      toast.error("Sản phẩm đã hết hàng");
      return;
    }

    setIsAdding(true);
    try {
      await addToCart(product.MaSP, 1);
      toast.success("Đã thêm vào giỏ hàng! 🛒");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
      {/* Product Header with AD Badge */}
      <div className="relative">
        <Link to={`/product/${product.MaSP}`}>
          <div className="w-full h-48 bg-gray-100 rounded-t-lg overflow-hidden">
            <img
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              src={mainImage}
              alt={product.TenSP}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = "/productdefaut.jpg";
              }}
            />
          </div>
        </Link>
        
        {/* AD Badge */}
        <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
          AD
        </span>
        
        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-t-lg flex items-center justify-center">
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
              Hết hàng
            </span>
          </div>
        )}
      </div>

      {/* Product Content */}
      <div className="p-4">
        {/* Product Title */}
        <Link to={`/product/${product.MaSP}`}>
          <h3 className="text-lg font-semibold text-gray-900 hover:text-green-600 transition-colors line-clamp-2 mb-2">
            {product.TenSP}
          </h3>
        </Link>

        {/* Origin & Category */}
        <p className="text-sm text-gray-500 mb-3 line-clamp-1">
          {product.NguonGoc} • {product.MoTa?.substring(0, 50)}...
        </p>

        {/* Rating Section
        <div className="flex items-center mb-3">
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-1">Chưa có</span>
            <span className="text-sm text-gray-500">(0 đánh giá)</span>
          </div>
        </div> */}
        {/* Rating */}
         <div className="flex items-center mt-2.5 mb-3">
           <div className="flex items-center space-x-1">
             {[1, 2, 3, 4, 5].map((star) => (
               <svg
                 key={star}
                 className={`w-4 h-4 ${
                   star <= Math.floor(rating)
                     ? "text-yellow-400 fill-yellow-400"
                     : "text-gray-200 fill-gray-200"
                 }`}
                 viewBox="0 0 22 20"
                 fill="currentColor"
               >
                 <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
               </svg>
             ))}
           </div>
           <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded ms-3">
             {rating > 0 ? rating.toFixed(1) : "Chưa có"}
           </span>
           <span className="text-xs text-gray-500 ms-2">
             ({reviewCount} đánh giá)
          </span>
         </div>

        {/* Price & Add to Cart Button */}
        <div className="flex items-center justify-between mb-3">
          {/* Price */}
          <span className="text-xl font-bold text-gray-900">
            {product.GiaBan.toLocaleString("vi-VN")}₫
          </span>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isAdding || isOutOfStock}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
              ${isOutOfStock 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : isAdding
                  ? 'bg-green-500 text-white cursor-wait'
                  : 'bg-green-600 hover:bg-green-700 text-white hover:scale-110'
              }
            `}
            title={isOutOfStock ? "Sản phẩm hết hàng" : "Thêm vào giỏ hàng"}
          >
            {isAdding ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded">
            Giao nhanh 2h
          </span>
          <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded">
            Chính hãng
          </span>
        </div>
      </div>
    </div>
  );
};