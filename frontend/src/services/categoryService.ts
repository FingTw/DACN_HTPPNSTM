// src/services/categoryService.ts
import { api } from "./api"; // Đảm bảo import đúng instance axios đã cấu hình interceptor

export interface Category {
  MaDM: string;
  TenDM: string;
  MoTa?: string;
  SoLuongSP?: number;
}

interface CategoryApiResponse {
  success: boolean;
  message: string;
  data:
    | {
        categories: Category[];
        pagination?: any;
      }
    | Category[]; // Handle trường hợp trả về mảng trực tiếp hoặc object
}

// 🟢 SỬA: Thêm đúng endpoint mà backend Node.js thường dùng
const CATEGORY_ENDPOINTS = ["/danhmuc", "/categories", "/rfq/categories"];

const normalizeResponse = (response: any): Category[] => {
  const payload = response.data;

  // Case 1: Backend trả về { success: true, data: { categories: [...] } } -> (Khớp danhmucController.js)
  if (payload?.data?.categories && Array.isArray(payload.data.categories)) {
    return payload.data.categories;
  }

  // Case 2: Backend trả về { success: true, data: [...] }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  // Case 3: Trả về mảng trực tiếp
  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
};

export const categoryService = {
  async getAllCategories(): Promise<Category[]> {
    for (const endpoint of CATEGORY_ENDPOINTS) {
      try {
        console.log(`🔄 Fetching categories from: ${endpoint}`);
        const response = await api.get(endpoint, {
          params: { limit: 100 }, // Lấy nhiều để đủ mapping cho AI
        });

        const categories = normalizeResponse(response);

        if (categories.length > 0) {
          console.log(
            `✅ Loaded ${categories.length} categories from ${endpoint}`
          );
          return categories;
        }
      } catch (error: any) {
        // Chỉ log nếu không phải 404 (endpoint không tồn tại)
        if (error.response?.status !== 404) {
          console.warn(`⚠️ Error at ${endpoint}:`, error.message);
        }
      }
    }

    console.error("❌ Failed to fetch categories from all endpoints");
    return [];
  },
};

export default categoryService;
