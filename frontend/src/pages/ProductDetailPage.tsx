// src/pages/ProductDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QuickAddButton } from '@/components/product/QuickAddButton';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

// Đổi từ export const thành export default
const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const { addToCart } = useCart();

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // TODO: Gọi API lấy chi tiết sản phẩm
        // const response = await productAPI.getProduct(id);
        // setProduct(response.data);
        
        // Mock data tạm thời
        setProduct({
          MaSP: id,
          TenSP: 'Sản phẩm mẫu',
          GiaBan: 100000,
          SLTon: 10,
          HinhAnh: '/placeholder-product.jpg',
          MoTa: 'Mô tả sản phẩm...',
          ChiTiet: 'Chi tiết sản phẩm...'
        });
      } catch (error) {
        toast.error('Lỗi khi tải thông tin sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleAddToCartWithQuantity = async () => {
    if (!product) return;

    try {
      await addToCart(product.MaSP, selectedQuantity);
      toast.success(`Đã thêm ${selectedQuantity} sản phẩm vào giỏ hàng!`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Không tìm thấy sản phẩm</h2>
        <p className="text-gray-600 mt-2">Sản phẩm bạn đang tìm kiếm không tồn tại.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div>
          <img
            src={product.HinhAnh || '/placeholder-product.jpg'}
            alt={product.TenSP}
            className="w-full h-96 object-cover rounded-lg"
          />
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">{product.TenSP}</h1>
          
          <div className="text-2xl font-bold text-green-600">
            {product.GiaBan.toLocaleString()}đ
          </div>

          <div className={`text-sm ${product.SLTon > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {product.SLTon > 0 ? `Còn ${product.SLTon} sản phẩm` : 'Hết hàng'}
          </div>

          <p className="text-gray-600">{product.MoTa}</p>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4">
            <label className="font-medium">Số lượng:</label>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setSelectedQuantity(prev => Math.max(1, prev - 1))}
                disabled={selectedQuantity <= 1}
                className="px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
              >
                -
              </button>
              <span className="px-4 py-2 min-w-12 text-center">{selectedQuantity}</span>
              <button
                onClick={() => setSelectedQuantity(prev => Math.min(product.SLTon, prev + 1))}
                disabled={selectedQuantity >= product.SLTon}
                className="px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleAddToCartWithQuantity}
              disabled={product.SLTon <= 0}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Thêm vào giỏ hàng
            </button>
            
            <button className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition-colors">
              Mua ngay
            </button>
          </div>

          {/* Quick Add Button (alternative) */}
          <div className="pt-4">
            <QuickAddButton 
              product={product} 
              size="lg" 
              className="w-full justify-center"
            />
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Chi tiết sản phẩm</h2>
        <div className="bg-gray-50 p-6 rounded-lg">
          <p className="text-gray-700">{product.ChiTiet || 'Đang cập nhật thông tin chi tiết...'}</p>
        </div>
      </div>
    </div>
  );
};

// THÊM DÒNG NÀY
export default ProductDetailPage;