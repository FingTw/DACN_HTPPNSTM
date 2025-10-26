import React from 'react';
import type { Product } from '../../services/productService';

interface CategoryCardProps {
  category: string;
  products: Product[];
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, products }) => {
  return (
    <div className="category-card">
      <h3>{category}</h3>
      <div className="category-products">
        {products.map(product => (
          <div key={product.id} className="category-product-item">
            <img src={product.image} alt={product.name} />
            <span>{product.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryCard;