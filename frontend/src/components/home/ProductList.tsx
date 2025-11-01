import React from "react";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/services/productService";

interface ProductListProps {
  products: Product[];
  title?: string;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  title,
}) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Không có sản phẩm nào
      </div>
    );
  }

  return (
    <section className="py-8 bg-white card rounded-xl shadow-md">
      {title && (
        <h2 className="text-2xl font-bold text-gray-900 mb-6 px-4 text-center">
          {title}
        </h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4 max-w-7xl mx-auto">
        {products.map((product) => (
          <ProductCard key={product.MaSP} product={product} />
        ))}
      </div>
    </section>
  );
};
