export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  description?: string;
}

export const productService = {
  async getAllProducts(): Promise<Product[]> {
    try {
      const response = await fetch('/api/sanpham');
      if (!response.ok) throw new Error('Failed to fetch products');
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  async getFeaturedProducts(): Promise<Product[]> {
    try {
      const response = await fetch('/api/sanpham?featured=true');
      if (!response.ok) throw new Error('Failed to fetch featured products');
      return await response.json();
    } catch (error) {
      console.error('Error fetching featured products:', error);
      return [];
    }
  },

  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const response = await fetch(`/api/sanpham?category=${category}`);
      if (!response.ok) throw new Error('Failed to fetch products by category');
      return await response.json();
    } catch (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }
  }
};