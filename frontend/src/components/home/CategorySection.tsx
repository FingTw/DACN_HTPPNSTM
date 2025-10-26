import React from 'react';
import { useProducts } from '../../hooks/useProducts';
import { categories } from '../data/mockData';
import CategoryCard from '../common/CategoryCard';

const CategorySection: React.FC = () => {
  const { products } = useProducts();

  // Nhóm sản phẩm theo category
  const productsByCategory = categories[0].items.map(category => ({
    name: category,
    products: products.filter(product => product.category === category).slice(0, 4)
  }));

  return (
    <section className="category-section">
      <h2>Shop by Category</h2>
      <div className="categories-grid">
        {productsByCategory.map((category, index) => (
          <CategoryCard
            key={index}
            category={category.name}
            products={category.products}
          />
        ))}
      </div>
    </section>
  );
};

export default CategorySection;