// src/components/product/QuickAddButton.tsx
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

interface QuickAddButtonProps {
  product: {
    MaSP: string;
    TenSP: string;
    SLTon: number;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const QuickAddButton: React.FC<QuickAddButtonProps> = ({ 
  product, 
  size = 'md', 
  className = '' 
}) => {
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

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={isAdding || product.SLTon <= 0}
      className={`
        ${sizeClasses[size]}
        ${product.SLTon <= 0
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-green-600 hover:bg-green-700 text-white'
        }
        rounded-lg font-medium transition-colors
        ${isAdding ? 'opacity-70 cursor-wait' : ''}
        ${className}
      `}
    >
      {isAdding ? (
        <div className="flex items-center gap-2">
          <div className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} border-2 border-white border-t-transparent rounded-full animate-spin`}></div>
          {size !== 'sm' && 'Đang thêm...'}
        </div>
      ) : (
        'Thêm vào giỏ'
      )}
    </button>
  );
};