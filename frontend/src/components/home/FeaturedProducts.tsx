import React from 'react';
import { useFeaturedProducts } from '../../hooks/useProducts';
import { fallbackProducts } from '../data/mockData';
import ProductCard from '../common/ProductCard';

const FeaturedProducts: React.FC = () => {
  const { featuredProducts, loading, error } = useFeaturedProducts();

  const displayProducts = error || loading ? fallbackProducts : featuredProducts;

  return (
    <section className="featured-products">
      <h2>Featured Products</h2>
      {loading && <div className="loading">Loading featured products...</div>}
      {error && <div className="error-message">Using sample data</div>}
      
      <div className="products-grid">
        {displayProducts.map(product => (
          <ProductCard 
            key={product.id}
            product={product}
          />
        ))}
      </div>
    </section>
  );
};

export default FeaturedProducts;