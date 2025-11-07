// src/components/product/ProductCard.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

interface Product {
  MaSP: string;
  TenSP: string;
  GiaBan: number;
  SLTon: number;
  HinhAnh?: string;
  MoTa?: string;
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isAdding, setIsAdding] = useState(false);
  const { user } = useAuth();
  const { addToCart } = useCart();

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }

    if (product.SLTon <= 0) {
      toast.error('Sản phẩm đã hết hàng');
      return;
    }

    setIsAdding(true);
    try {
      await addToCart(product.MaSP, 1);
      toast.success('Đã thêm vào giỏ hàng!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Product Image */}
      <Link to={`/product/${product.MaSP}`} className="block aspect-w-1 aspect-h-1">
        <img
          src={product.HinhAnh || '/placeholder-product.jpg'}
          alt={product.TenSP}
          className="w-full h-48 object-cover hover:scale-105 transition-transform"
        />
      </Link>

      {/* Product Info */}
      <div className="p-4">
        <Link to={`/product/${product.MaSP}`}>
          <h3 className="font-semibold text-gray-900 mb-2 hover:text-green-600 transition-colors line-clamp-2">
            {product.TenSP}
          </h3>
        </Link>

        {product.MoTa && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.MoTa}
          </p>
        )}

        {/* Price and Stock */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-green-600 font-bold text-lg">
            {product.GiaBan.toLocaleString()}đ
          </span>
          <span className={`text-sm ${product.SLTon > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {product.SLTon > 0 ? `Còn ${product.SLTon} sp` : 'Hết hàng'}
          </span>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={isAdding || product.SLTon <= 0}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            product.SLTon <= 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          } ${isAdding ? 'opacity-70 cursor-wait' : ''}`}
        >
          {isAdding ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Đang thêm...
            </div>
          ) : (
            'Thêm vào giỏ'
          )}
        </button>
      </div>
    </div>
  );
};