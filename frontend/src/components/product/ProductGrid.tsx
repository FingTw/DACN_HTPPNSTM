// src/components/product/ProductGrid.tsx
import React from 'react';
import { ProductCard } from './ProductCard';

interface Product {
  MaSP: string;
  TenSP: string;
  GiaBan: number;
  SLTon: number;
  HinhAnh?: string;
  MoTa?: string;
}

interface ProductGridProps {
  products: Product[];
  title?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, title }) => {
  return (
    <div className="py-8">
      {title && (
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.MaSP} product={product} />
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Không có sản phẩm nào</p>
        </div>
      )}
    </div>
  );
};