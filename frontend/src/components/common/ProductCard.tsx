import React from 'react';
import type { Product } from '../../services/productService';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // Nếu product.image là tên file (vd: 'product-fruits.jpg'), ta trỏ trực tiếp vào public/
  const imageSrc = product.image?.startsWith('http')
    ? product.image // ảnh ngoài
    : `/${product.image}`; // ảnh trong thư mục public/

  return (
    <div className="product-card">
      <img
        src={imageSrc}
        alt={product.TenSP}
        onError={(e) => {
          // fallback khi ảnh bị lỗi
          e.currentTarget.onerror = null;
          e.currentTarget.src = '/placeholder.jpg'; // ảnh này cũng nên nằm trong public/
        }}
      />
      <h3>{product.TenSP}</h3>
      <p className="price">{product.GiaBan.toLocaleString()}₫</p>
      {/* <span className="category-badge">{product.}</span> */}
    </div>
  );
};

export default ProductCard;
