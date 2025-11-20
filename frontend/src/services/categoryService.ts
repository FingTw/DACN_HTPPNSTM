// src/services/categoryService.ts
import api from "./api";

export interface Category {
  MaDM: string;
  TenDM: string;
  MoTa?: string;
  SoLuongSP?: number;
}

interface CategoryApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
}

const CATEGORY_ENDPOINTS = ["/rfq/categories", "/categories", "/danhmuc"];

const normalizeResponse = (payload: any): Category[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.categories)) return payload.data.categories;
  return [];
};

export const categoryService = {
  async getAllCategories(): Promise<Category[]> {
    let lastError: any = null;

    for (const endpoint of CATEGORY_ENDPOINTS) {
      try {
        const response = await api.get<CategoryApiResponse<any>>(endpoint);
        return normalizeResponse(response.data);
      } catch (error: any) {
        lastError = error;

        // Với lỗi khác 404, dừng luôn để tránh che giấu vấn đề thật sự
        if (error.response?.status && error.response.status !== 404) {
          throw new Error(
            error.response?.data?.message || "Lỗi khi lấy danh mục"
          );
        }
      }
    }

    throw new Error(
      lastError?.response?.data?.message ||
        "Endpoint lấy danh mục không tồn tại. Vui lòng kiểm tra backend."
    );
  },
};

export default categoryService;
