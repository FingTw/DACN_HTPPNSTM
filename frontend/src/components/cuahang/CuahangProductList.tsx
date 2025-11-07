import React from "react";
import { ProductCard } from "../home/ProductCard"; // Import ProductCard

interface CuahangProductListProps {
  products: any[];
}

export default function CuahangProductList({
  products,
}: CuahangProductListProps) {
  console.log("📦 CuahangProductList RENDER - products:", products);

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-lg">Cửa hàng chưa có sản phẩm nào.</p>
      </div>
    );
  }

  // 🟢 SỬA: SỬ DỤNG ProductCard ĐỂ HIỂN THỊ ĐẸP
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {products.map((product) => (
        <ProductCard key={product.MaSP} product={product} />
      ))}
    </div>
  );
}
