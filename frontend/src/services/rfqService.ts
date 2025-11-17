// src/services/rfqService.ts
import api from "./api";

// ============================================
// TYPES
// ============================================

export interface BuyerRequest {
  MaYCDH: string;
  MaTK_Buyer: string;
  MaDM?: string;
  TenSP_YeuCau: string;
  SoLuongYeuCau: number;
  ChatLuongYeuCau?: string;
  GiaMongMuon: number;
  NgayTao: string;
  ThoiHan: string;
  TrangThai: "Open" | "PartiallyFilled" | "Completed" | "Expired" | "Cancelled";
}

export interface Proposal {
  MaDNCC: string;
  MaYCDH: string;
  MaTK_Seller: string;
  MaSP: string;
  SoLuongCungCap: number;
  GiaDeNghi: number;
  ChatLuongDeNghi?: string;
  NgayDeNghi: string;
  TrangThai: "Pending" | "Accepted" | "Rejected";
  MaTK_Seller_taikhoan?: {
    MaTK: string;
    HoTen: string;
    Email: string;
    SDT: string;
    cuahangs?: Array<{
      MaCH: string;
      TenCH: string;
      DiaChi: string;
      SDT: string;
      MoTa?: string;
    }>;
  };
  MaSP_sanpham?: {
    MaSP: string;
    TenSP: string;
    MoTa?: string;
    Gia: number;
    SoLuongTonKho: number;
    DonViTinh?: string;
  };
}

export interface Product {
  MaSP: string;
  TenSP: string;
  MoTa?: string;
  Gia: number;
  SoLuongTonKho: number;
  DonViTinh?: string;
  MaCH: string;
  cuahang?: {
    MaCH: string;
    TenCH: string;
  };
}

export interface BuyerStatistics {
  totalRequests: number;
  openRequests: number;
  partiallyFilledRequests: number;
  completedRequests: number;
  totalProposalsReceived: number;
  pendingProposals: number;
  acceptedProposals: number;
  totalSpent: number;
}

export interface SellerStatistics {
  totalProposals: number;
  pendingProposals: number;
  acceptedProposals: number;
  rejectedProposals: number;
  acceptanceRate: string;
  totalRevenue: number;
  totalQuantitySold: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// RFQ SERVICE
// ============================================

export const rfqService = {
  /* ============================
   📋 NGƯỜI MUA (BUYER)
  ============================ */

  // 1. Tạo yêu cầu mua hàng mới
  createRequest: async (requestData: {
    MaDM?: string;
    TenSP_YeuCau: string;
    SoLuongYeuCau: number;
    ChatLuongYeuCau?: string;
    GiaMongMuon?: number;
    ThoiHan?: string;
  }): Promise<ApiResponse<BuyerRequest>> => {
    try {
      const response = await api.post("/rfq/buyer/requests", requestData);
      return response.data;
    } catch (error: any) {
      console.error("Lỗi tạo yêu cầu:", error);
      throw new Error(
        error.response?.data?.message || "Lỗi khi tạo yêu cầu mua hàng"
      );
    }
  },

  // 2. Xem danh sách yêu cầu của mình
  getMyRequests: async (params?: {
    TrangThai?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<BuyerRequest[]>> => {
    try {
      const response = await api.get("/rfq/buyer/requests", { params });
      return response.data;
    } catch (error: any) {
      console.error("Lỗi lấy danh sách yêu cầu:", error);
      throw new Error(
        error.response?.data?.message || "Lỗi khi lấy danh sách yêu cầu"
      );
    }
  },

  // 3. Xem đề nghị cho một yêu cầu cụ thể
  getProposalsForRequest: async (
    MaYCDH: string
  ): Promise<
    ApiResponse<{
      request: BuyerRequest;
      proposals: Proposal[];
      summary: {
        total: number;
        pending: number;
        accepted: number;
        rejected: number;
        progress: {
          requested: number;
          fulfilled: number;
          remaining: number;
        };
      };
    }>
  > => {
    try {
      const response = await api.get(`/rfq/buyer/requests/${MaYCDH}/proposals`);
      return response.data;
    } catch (error: any) {
      console.error("Lỗi lấy đề nghị:", error);
      throw new Error(
        error.response?.data?.message || "Lỗi khi lấy danh sách đề nghị"
      );
    }
  },

  // 4. Chấp nhận đề nghị
  acceptProposal: async (acceptData: {
    MaDNCC: string;
    SoLuongMua?: number;
    GhiChu?: string;
  }): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post(
        "/rfq/buyer/proposals/accept",
        acceptData
      );
      return response.data;
    } catch (error: any) {
      console.error("Lỗi chấp nhận đề nghị:", error);
      throw new Error(
        error.response?.data?.message || "Lỗi khi chấp nhận đề nghị"
      );
    }
  },

  // 5. Từ chối đề nghị
  rejectProposal: async (
    MaDNCC: string,
    LyDoTuChoi?: string
  ): Promise<ApiResponse<Proposal>> => {
    try {
      const response = await api.put(`/rfq/buyer/proposals/${MaDNCC}/reject`, {
        LyDoTuChoi,
      });
      return response.data;
    } catch (error: any) {
      console.error("Lỗi từ chối đề nghị:", error);
      throw new Error(
        error.response?.data?.message || "Lỗi khi từ chối đề nghị"
      );
    }
  },

  // 6. Thống kê cho người mua
  getBuyerStatistics: async (): Promise<ApiResponse<BuyerStatistics>> => {
    try {
      const response = await api.get("/rfq/buyer/statistics");
      return response.data;
    } catch (error: any) {
      console.error("Lỗi lấy thống kê:", error);
      throw new Error(error.response?.data?.message || "Lỗi khi lấy thống kê");
    }
  },

  /* ============================
   🏪 NGƯỜI BÁN (SELLER)
  ============================ */

  // 7. Xem tất cả yêu cầu đang mở
  getAllOpenRequests: async (params?: {
    MaDM?: string;
    keyword?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<BuyerRequest[]>> => {
    try {
      const response = await api.get("/rfq/seller/requests", { params });
      return response.data;
    } catch (error: any) {
      console.error("Lỗi lấy yêu cầu đang mở:", error);
      throw new Error(
        error.response?.data?.message || "Lỗi khi lấy danh sách yêu cầu"
      );
    }
  },

  // 8. Xem yêu cầu mới trong 24h
  getNewRequests: async (params?: {
    MaDM?: string;
    limit?: number;
  }): Promise<ApiResponse<BuyerRequest[]>> => {
    try {
      const response = await api.get("/rfq/seller/requests/new", { params });
      return response.data;
    } catch (error: any) {
      console.error("Lỗi lấy yêu cầu mới:", error);
      throw new Error(
        error.response?.data?.message || "Lỗi khi lấy yêu cầu mới"
      );
    }
  },

  // 9. Xem sản phẩm của mình để đề nghị
  getMyProducts: async (params?: {
    keyword?: string;
    MaDM?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Product[]>> => {
    try {
      const response = await api.get("/rfq/seller/products", { params });
      return response.data;
    } catch (error: any) {
      console.error("Lỗi lấy sản phẩm:", error);
      throw new Error(
        error.response?.data?.message || "Lỗi khi lấy danh sách sản phẩm"
      );
    }
  },

  // 10. Gửi đề nghị cung cấp
  submitProposal: async (proposalData: {
    MaYCDH: string;
    MaSP: string;
    SoLuongCungCap: number;
    GiaDeNghi: number;
    ChatLuongDeNghi?: string;
  }): Promise<ApiResponse<Proposal>> => {
    try {
      const response = await api.post("/rfq/seller/proposals", proposalData);
      return response.data;
    } catch (error: any) {
      console.error("Lỗi gửi đề nghị:", error);
      throw new Error(
        error.response?.data?.message || "Lỗi khi gửi đề nghị cung cấp"
      );
    }
  },

  // 11. Xem đề nghị của mình
  getMyProposals: async (params?: {
    TrangThai?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Proposal[]>> => {
    try {
      const response = await api.get("/rfq/seller/proposals", { params });
      return response.data;
    } catch (error: any) {
      console.error("Lỗi lấy đề nghị:", error);
      throw new Error(
        error.response?.data?.message || "Lỗi khi lấy danh sách đề nghị"
      );
    }
  },

  // 12. Cập nhật đề nghị
  updateProposal: async (
    MaDNCC: string,
    updateData: {
      SoLuongCungCap?: number;
      GiaDeNghi?: number;
      ChatLuongDeNghi?: string;
    }
  ): Promise<ApiResponse<Proposal>> => {
    try {
      const response = await api.put(
        `/rfq/seller/proposals/${MaDNCC}`,
        updateData
      );
      return response.data;
    } catch (error: any) {
      console.error("Lỗi cập nhật đề nghị:", error);
      throw new Error(
        error.response?.data?.message || "Lỗi khi cập nhật đề nghị"
      );
    }
  },

  // 13. Hủy đề nghị
  cancelProposal: async (MaDNCC: string): Promise<ApiResponse<Proposal>> => {
    try {
      const response = await api.delete(`/rfq/seller/proposals/${MaDNCC}`);
      return response.data;
    } catch (error: any) {
      console.error("Lỗi hủy đề nghị:", error);
      throw new Error(error.response?.data?.message || "Lỗi khi hủy đề nghị");
    }
  },

  // 14. Thống kê cho người bán
  getSellerStatistics: async (): Promise<ApiResponse<SellerStatistics>> => {
    try {
      const response = await api.get("/rfq/seller/statistics");
      return response.data;
    } catch (error: any) {
      console.error("Lỗi lấy thống kê:", error);
      throw new Error(error.response?.data?.message || "Lỗi khi lấy thống kê");
    }
  },

  /* ============================
   🌐 PUBLIC
  ============================ */

  // 15. Xem yêu cầu công khai (không cần đăng nhập)
  getPublicRequests: async (params?: {
    MaDM?: string;
    keyword?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<BuyerRequest[]>> => {
    try {
      const response = await api.get("/rfq/public/requests", { params });
      return response.data;
    } catch (error: any) {
      console.error("Lỗi lấy yêu cầu công khai:", error);
      throw new Error(
        error.response?.data?.message || "Lỗi khi lấy danh sách yêu cầu"
      );
    }
  },
};

export default rfqService;
