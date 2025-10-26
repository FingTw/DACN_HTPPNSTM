import { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import type { Product } from '../services/productService';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, error, refetch: loadProducts };
};

export const useFeaturedProducts = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getFeaturedProducts();
      setFeaturedProducts(data);
    } catch (err) {
      setError('Failed to load featured products');
    } finally {
      setLoading(false);
    }
  };

  return { featuredProducts, loading, error };
};