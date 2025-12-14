// components/cuahang/store.ts
// components/cuahang/store.ts - CẬP NHẬT INTERFACE
export interface Store {
  MaCH: string;
  TenCH: string;
  MoTa?: string;
  SLTheoDoi: number;
  DiemDG: number;
  SoDu?: number | string;
  DCLayHang?: string;
  NgayTao?: string;
  MaTK: string;
  MaHA_CuaHang?: string;
  MaHA_CuaHang_hinhanh?: {
    URL: string;
    MoTa?: string;
  };
  hdbanhang?: {
    LoaiHinhKD: string;
    MaSoThue?: string;
    DCLayHang?: string;
    NgayLap?: string;
    MaHD?: string;
  };
}

export interface StoreFormData {
  TenCH: string;
  DCLayHang: string;
  MoTa: string;
}

// 🟢 INTERFACE DANH MỤC
export interface DanhMuc {
  MaDM: string;
  TenDM: string;
  MoTa?: string;
  MaHA_DanhMuc?: string;
  hinhanh?: {
    URL: string;
    MoTa?: string;
  };
  SoLuongSP?: number; // 🟢 THÊM DÒNG NÀY
}

export interface Product {
  MaSP: string;
  TenSP: string;
  GiaBan: number;
  SLTon: number;
  DVT: string;
  TrangThai: string;
  MoTa?: string;
  MaCH: string;
  MaHA_SanPham?: string;
  // 🟢 THÊM DANH MỤC CHO SẢN PHẨM
  danhMucIds?: string[]; // Mảng ID danh mục
  MaDM_danhmucs?: DanhMuc[]; // Danh sách đối tượng danh mục đầy đủ
  // 🟢 THÊM NHIỀU HÌNH ẢNH
  hinhanhs?: {
    MaHA: string;
    URL: string;
    MoTa?: string;
  }[];
}

export interface UserData {
  MaTK: string;
  TenDangNhap: string;
  Email: string;
}

// 🟢 INTERFACE CHO FORM THÊM/SỬA SẢN PHẨM
export interface ProductFormData {
  TenSP: string;
  MoTa: string;
  GiaBan: string;
  SLTon: string;
  DVT: string;
  TrangThai: "active" | "inactive";
  danhMucIds: string[];
  HinhAnhs: File[];
  HinhAnhPreviews: string[];
  NguonGoc?: string;
  HSD?: string;
}

// 🟢 INTERFACE CHO API RESPONSE
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

// 🟢 INTERFACE CHO PRODUCT LIST RESPONSE
export interface ProductListResponse {
  products: Product[];
  store?: {
    MaCH: string;
    TenCH: string;
  };
  pagination?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

// 🟢 INTERFACE CHO SEARCH/FILTER PARAMS
export interface ProductSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  MaCH?: string;
  danhMucIds?: string[];
  include?: string;
}
