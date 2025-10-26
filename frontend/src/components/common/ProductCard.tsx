import React from 'react';
import type { Product } from '../../services/productService';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="product-card">
      <img 
        src={product.image} 
        alt={product.name}
        onError={(e) => {
          e.currentTarget.src = '/images/placeholder.jpg';
        }}
      />
      <h3>{product.name}</h3>
      <p className="price">${product.price.toFixed(2)}</p>
      <span className="category-badge">{product.category}</span>
    </div>
  );
};

export default ProductCard;