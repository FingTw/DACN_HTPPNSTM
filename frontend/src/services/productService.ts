import { api } from "./api"; // ← SỬA TỪ "./authService" → "./api"
import type { ApiResponse } from "./api";

export interface Product {
  MaSP: string;
  TenSP: string;
  GiaBan: number;
  SLTonKho: number;
  MoTa: string;
  NguonGoc: string;
  DiemDG_SP: number;
  MaCH: string;
  // Optional from include
  cuahang?: {
    MaCH: string;
    TenCH: string;
    DiemDG: number;
    SLTheoDoi: number;
  };
  hinhanhs?: Array<{
    MaHA: string;
    URL: string;
    MoTa: string;
  }>;
  sanpham_danhmucs?: Array<{
    MaSP_DM: string;
    danhmuc: {
      MaDM: string;
      TenDM: string;
    };
  }>;
  danhgias?: Array<{
    MaDG: string;
    Diem: number;
    NoiDung: string;
    NgayDG: string;
    HieuLuc: boolean;
    nguoidanhgia: {
      MaTK: string;
      TenDangNhap: string;
    };
  }>;
}

export const productService = {
  async getAllProducts(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      minPrice?: number;
      maxPrice?: number;
      minRating?: number;
      include?: string; // e.g., 'cuahang,hinhanh,danhgia'
    } = {}
  ): Promise<{ products: Product[]; pagination: any }> {
    try {
      const response = await api.get("/sanpham", { params });
      return response.data.data;
    } catch (error) {
      console.error("Error fetching products:", error);
      return { products: [], pagination: {} };
    }
  },

  async getFeaturedProducts(): Promise<Product[]> {
    try {
      const response = await api.get("/sanpham", {
        params: { limit: 20, include: "hinhanh,danhgia" },
      });
      return response.data.data.products;
    } catch (error) {
      console.error("Error fetching featured products:", error);
      return [];
    }
  },

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    try {
      const response = await api.get("/sanpham", {
        params: { MaDM: categoryId }, // Giả sử backend hỗ trợ lọc MaDM, nếu không thì thêm logic
      });
      return response.data.data.products;
    } catch (error) {
      console.error("Error fetching products by category:", error);
      return [];
    }
  },

  async getProductById(id: string): Promise<Product | null> {
    try {
      const response = await api.get(`/sanpham/${id}`, {
        params: { include: "cuahang,hinhanh,danhmuc,danhgia" },
      });
      return response.data.data;
    } catch (error) {
      console.error("Error fetching product by ID:", error);
      return null;
    }
  },
};
