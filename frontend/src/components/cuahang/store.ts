// components/cuahang/store.ts
// components/cuahang/store.ts - CẬP NHẬT INTERFACE
export interface Store {
  MaCH: string;
  TenCH: string;
  MoTa?: string;
  SLTheoDoi: number;
  DiemDG: number;
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

export interface Product {
  MaSP: string;
  TenSP: string;
  GiaBan: number;
  SLTon: number;
  DVT: string;
  TrangThai: string;
  MoTa?: string;
  MaCH: string;
  MaHA_SanPham?: string; // 🟢 THÊM TRƯỜNG HÌNH ẢNH SẢN PHẨM
  hinhanh?: {
    // 🟢 THÊM CHO TRƯỜNG HỢP BACKEND TRẢ VỀ OBJECT HÌNH ẢNH
    URL: string;
    MoTa?: string;
  };
}

export interface UserData {
  MaTK: string;
  TenDangNhap: string;
  Email: string;
}
