// src/services/orderService.ts
import { api } from "./api";
import type { ApiResponse } from "./api";

// ============================================
// TYPES
// ============================================

export interface OrderItem {
  MaSP: string;
  SL: number;
  GiaBan: number;
}

export interface ProcessCheckoutData {
  DCNhanHang: string;
  MaPTVC: string | null;
  deliveryType?: string; // 🆕 Thêm deliveryType
  MaPTTT: string | null;
  TongTien: number;
  items: OrderItem[];
  PhiVanChuyen: number;
  appliedVouchers?: string[];
}

export interface Order {
  MaDH: string;
  TrangThai: string;
  TongTien: number;
  NgayTao: string;
  DCNhanHang: string;
  chitiet_donhangs?: Array<{
    MaSP: string;
    TenSP: string;
    SoLuong: number;
    GiaBan: number;
  }>;
}

export interface PaymentMethod {
  MaPTTT: string;
  TenPTTT: string;
}

// 🆕 Thêm interface mới cho Shipping
export interface AvailableShippingResponse {
  success: boolean;
  data: {
    availableMethods: ShippingMethod[];
    zone: string;
    unavailableReasons: Record<string, string>;
  };
  message: string;
}

export interface ShippingMethod {
  MaPTVC: string;
  TenPTVC: string;
  PhiVanChuyen: number;
  ThoiGianGiaoHang: string;
  TocDo: string;
  isAvailable: boolean;
  UuDai: string[];
  zone: string;
  metadata?: {
    pricingSource: string;
    ruleApplied: string;
    administrativeScope: string;
  };
}

export interface ShippingCalculationRequest {
  deliveryAddress: string;
  items: OrderItem[];
  deliveryType: string;
}

export interface ShippingCalculationResponse {
  success: boolean;
  data: {
    deliveryFee: number;
    deliveryType: string;
    zone: string;
    metadata: {
      originProvince: string;
      destinationProvince: string;
      isIntraCity: boolean;
      isIntraProvince: boolean;
      pricingSource: string;
      ruleApplied: string;
      estimatedDistance?: number;
      administrativeScope: string;
      calculatedAt: string;
    };
  };
  message: string;
}

export interface ShippingValidationRequest {
  deliveryAddress: string;
  deliveryType: string;
}

export interface ShippingValidationResponse {
  success: boolean;
  data: {
    deliveryFee: number;
    deliveryType: string;
    zone: string;
    metadata: any;
  };
  message: string;
}

// ============================================
// SHIPPING CALCULATION TYPES (CŨ - CHO TƯƠNG THÍCH)
// ============================================

export interface ShippingCalculationRequestOld {
  province: string;
  district: string;
  items: OrderItem[];
  deliverySpeed: "standard" | "fast" | "express" | "super_express";
  totalWeight: number;
  isUrbanArea: boolean;
  isPeakHours: boolean;
}

export interface ShippingCalculationResult {
  MaPTVC: string;
  TenPTVC: string;
  PhiVanChuyen: number;
  ThoiGianGiaoHang: string;
  TocDo: "standard" | "fast" | "express" | "super_express";
  UuDai?: string[];
  estimatedDelivery: string;
  isAvailable: boolean;
  constraints?: string[];
}

// ============================================
// ORDER SERVICE
// ============================================

export const orderService = {
  // 1. Checkout giỏ hàng
  checkout: async (): Promise<any[] | null> => {
    try {
      const response = await api.get<ApiResponse<any[]>>("/order/checkout");
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi checkout:", error);
      return null;
    }
  },

  // 2. Checkout item cụ thể
  checkoutItem: async (MaSP: string): Promise<any | null> => {
    try {
      const response = await api.post<ApiResponse<any>>(
        "/order/checkout-item",
        { MaSP }
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi checkout item:", error);
      return null;
    }
  },

  // 3. Xử lý checkout
  processCheckout: async (
    data: ProcessCheckoutData & { appliedVouchers?: string[] }
  ): Promise<{ MaDH: string; listMaDH: string[]; message: string; totalAmount: number }> => {
    try {
      console.log("🔄 Calling endpoint: POST /order/process-checkout");
      console.log("📦 Payload:", data);

      const response = await api.post("/order/process-checkout", data);

      console.log("📨 Raw response:", response);
      console.log("📨 Response data:", response.data);

      if (!response.data) {
        console.log("❌ Response data is completely undefined");
        throw new Error("Không nhận được phản hồi từ server");
      }

      if (response.data.success === false) {
        console.log("❌ Backend returned success: false");
        throw new Error(response.data.message || "Đặt hàng thất bại");
      }

      if (response.data.MaDH || response.data.listMaDH) {
        console.log("✅ Backend returned order data:", response.data);
        return response.data;
      }

      // Trường hợp backend trả về data trực tiếp (không wrap)
      if (response.data.data?.MaDH) {
        console.log("✅ Backend returned direct order data");
        return response.data.data;
      }

      console.log("❌ No valid data in response");
      throw new Error("Phản hồi từ server không hợp lệ");
    } catch (error: any) {
      console.error("❌ Lỗi process checkout:");
      console.error("- Error:", error.message);
      console.error("- Response status:", error.response?.status);
      console.error("- Response data:", error.response?.data);

      // Phân loại lỗi để hiển thị thông báo phù hợp
      if (error.response?.status === 400) {
        throw new Error(
          error.response?.data?.message || "Dữ liệu không hợp lệ"
        );
      } else if (error.response?.status === 401) {
        throw new Error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại");
      } else if (error.response?.status === 500) {
        throw new Error("Lỗi hệ thống, vui lòng thử lại sau");
      } else {
        throw new Error(
          error.response?.data?.message || error.message || "Đặt hàng thất bại"
        );
      }
    }
  },

  // 4. Lấy đơn hàng của tôi
  getMyOrders: async (): Promise<Order[] | null> => {
    try {
      const response = await api.get<ApiResponse<Order[]>>("/order/all");
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi lấy đơn hàng:", error);
      return null;
    }
  },

  // 5. Lấy chi tiết đơn hàng thành công
  getOrderSuccess: async (MaDH: string): Promise<Order | null> => {
    try {
      const response = await api.get<ApiResponse<Order>>(
        `/order/order-success/${MaDH}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi lấy chi tiết đơn hàng:", error);
      return null;
    }
  },

  // 6. Cập nhật trạng thái đơn hàng
  updateOrderStatus: async (
    MaDH: string,
    TrangThai: string
  ): Promise<boolean> => {
    try {
      await api.put(`/order/update-status/${MaDH}`, { TrangThai });
      return true;
    } catch (error: any) {
      console.error("Lỗi cập nhật trạng thái:", error);
      return false;
    }
  },

  // 7. Lấy danh sách phương thức vận chuyển từ DB
  getShippingMethods: async (): Promise<PaymentMethod[] | null> => {
    try {
      const response = await api.get<ApiResponse<PaymentMethod[]>>(
        "/order/shipping-methods"
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi lấy phương thức vận chuyển:", error);
      // Fallback cho các mã PTVC cơ bản
      return [
        { MaPTTT: "VC01", TenPTTT: "Giao hàng tiêu chuẩn" },
        { MaPTTT: "VC02", TenPTTT: "Giao hàng nhanh" },
      ];
    }
  },

  // 8. Lấy danh sách phương thức thanh toán
  getPaymentMethods: async (): Promise<PaymentMethod[] | null> => {
    try {
      const response = await api.get<ApiResponse<PaymentMethod[]>>(
        "/order/payment-methods"
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi lấy phương thức thanh toán:", error);
      // Fallback
      return [
        { MaPTTT: "TT01", TenPTTT: "Thanh toán khi nhận hàng (COD)" },
        { MaPTTT: "TT02", TenPTTT: "Chuyển khoản ngân hàng" },
        { MaPTTT: "PAYPAL", TenPTTT: "Thanh toán qua PayPal (Visa/MasterCard)" },
      ];
    }
  },

  // ============================================
  // 🆕 API VẬN CHUYỂN MỚI
  // ============================================

  // 🆕 9. Lấy tất cả phương thức vận chuyển khả dụng cho địa chỉ
  getAvailableShippingMethods: async (
    deliveryAddress: string
  ): Promise<AvailableShippingResponse> => {
    try {
      const response = await api.post<AvailableShippingResponse>(
        "/order/shipping/methods",
        { deliveryAddress }
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Lỗi lấy phương thức vận chuyển khả dụng:", error);
      throw new Error(error.response?.data?.message || "Không thể lấy phương thức vận chuyển");
    }
  },

  // 🆕 10. Tính phí vận chuyển cho một loại giao hàng cụ thể
  calculateShippingFee: async (
    data: ShippingCalculationRequest
  ): Promise<ShippingCalculationResponse> => {
    try {
      const response = await api.post<ShippingCalculationResponse>(
        "/order/calculate-shipping",
        data
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Lỗi tính phí vận chuyển:", error);
      throw new Error(error.response?.data?.message || "Không thể tính phí vận chuyển");
    }
  },

  // 🆕 11. Validate phương thức vận chuyển
  validateShippingMethod: async (
    data: ShippingValidationRequest
  ): Promise<ShippingValidationResponse> => {
    try {
      const response = await api.post<ShippingValidationResponse>(
        "/order/shipping/validate",
        data
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Lỗi validate phương thức vận chuyển:", error);
      throw new Error(error.response?.data?.message || "Không thể validate phương thức vận chuyển");
    }
  },

  // ============================================
  // API CŨ (CHO TƯƠNG THÍCH)
  // ============================================

  // 🟡 Hàm cũ: Tính toán phí vận chuyển theo tốc độ (cho tương thích)
  calculateShipping: async (
    request: ShippingCalculationRequestOld
  ): Promise<ShippingCalculationResult[] | null> => {
    try {
      console.log("🚀 Gửi request tính phí VC (cũ):", request);

      // 🆕 Chuyển đổi request cũ sang request mới
      const deliveryAddress = `${request.district}, ${request.province}`;
      
      // Gọi API mới để lấy phương thức khả dụng
      const methodsResponse = await api.post<AvailableShippingResponse>(
        "/order/shipping/methods",
        { deliveryAddress }
      );

      if (!methodsResponse.data.success) {
        throw new Error(methodsResponse.data.message);
      }

      const availableMethods = methodsResponse.data.data.availableMethods;

      // Map sang ShippingCalculationResult[] (cấu trúc cũ)
      const results: ShippingCalculationResult[] = availableMethods
        .filter(method => method.isAvailable)
        .map(method => ({
          MaPTVC: method.MaPTVC,
          TenPTVC: method.TenPTVC,
          PhiVanChuyen: method.PhiVanChuyen,
          ThoiGianGiaoHang: method.ThoiGianGiaoHang,
          TocDo: method.TocDo as "standard" | "fast" | "express" | "super_express",
          UuDai: method.UuDai,
          estimatedDelivery: calculateEstimatedDelivery(method.TocDo),
          isAvailable: method.isAvailable,
        }));

      console.log("✅ Phản hồi từ server (đã chuyển đổi):", results);
      return results;
    } catch (error: any) {
      console.error("❌ Lỗi tính phí vận chuyển (cũ):", error);
      console.error("❌ Chi tiết lỗi:", error.response?.data);
      return await calculateShippingFallback(request);
    }
  },

  // 🆕 12. Lấy phương thức vận chuyển tốc độ cao (cho tương thích)
  getExpressShippingMethods: async (): Promise<ShippingMethod[] | null> => {
    try {
      // Gọi API mới và lọc các phương thức express/super_express
      const response = await api.get<ApiResponse<ShippingMethod[]>>(
        "/order/shipping-methods"
      );
      
      if (response.data.data) {
        const expressMethods = response.data.data.filter(method => 
          method.TocDo === 'express' || method.TocDo === 'super_express'
        );
        return expressMethods;
      }
      return getExpressShippingFallback();
    } catch (error: any) {
      console.error("Lỗi lấy phương thức vận chuyển tốc độ cao:", error);
      return getExpressShippingFallback();
    }
  },

  // 🆕 13. Kiểm tra tính khả thi của đơn hàng tốc độ cao (cho tương thích)
  validateExpressOrder: async (data: {
    province: string;
    district: string;
    items: OrderItem[];
    deliverySpeed: "express" | "super_express";
  }): Promise<{
    isValid: boolean;
    message?: string;
    constraints?: string[];
  }> => {
    try {
      const deliveryAddress = `${data.district}, ${data.province}`;
      
      // Gọi API validate mới
      const response = await api.post<ShippingValidationResponse>(
        "/order/shipping/validate",
        {
          deliveryAddress,
          deliveryType: data.deliverySpeed
        }
      );

      return {
        isValid: response.data.success,
        message: response.data.message,
        constraints: response.data.success ? [] : [response.data.message]
      };
    } catch (error: any) {
      console.error("Lỗi validate đơn hàng tốc độ cao:", error);
      return validateExpressOrderFallback(data);
    }
  },
};

// ============================================
// FALLBACK IMPLEMENTATIONS (CHO TƯƠNG THÍCH)
// ============================================

const calculateShippingFallback = async (
  request: ShippingCalculationRequestOld
): Promise<ShippingCalculationResult[]> => {
  console.log("🔄 Using fallback shipping calculation");
  
  const baseCost = calculateBaseCost(request);
  const speedMultiplier = getSpeedMultiplier(request.deliverySpeed);
  const areaMultiplier = request.isUrbanArea ? 1 : 1.3;
  const timeMultiplier = request.isPeakHours ? 1.2 : 1;

  const shippingCost = Math.round(
    baseCost *
      speedMultiplier *
      areaMultiplier *
      timeMultiplier *
      request.totalWeight
  );

  const results: ShippingCalculationResult[] = [
    {
      MaPTVC: "VC03",
      TenPTVC: "Giao hàng tiêu chuẩn",
      PhiVanChuyen: Math.round(
        baseCost * 1 * areaMultiplier * request.totalWeight
      ),
      ThoiGianGiaoHang: "2-3 ngày",
      TocDo: "standard",
      estimatedDelivery: calculateEstimatedDelivery("standard"),
      isAvailable: true,
      UuDai: ["Miễn phí đổi trả trong 7 ngày"],
    },
    {
      MaPTVC: "VC04",
      TenPTVC: "Giao hàng nhanh",
      PhiVanChuyen: Math.round(
        baseCost * 1.3 * areaMultiplier * request.totalWeight
      ),
      ThoiGianGiaoHang: "24 giờ",
      TocDo: "fast",
      estimatedDelivery: calculateEstimatedDelivery("fast"),
      isAvailable: true,
      UuDai: ["Hỗ trợ 24/7", "Đổi trả nhanh"],
    },
  ];

  // Chỉ thêm express nếu trong khu vực hỗ trợ
  if (
    request.isUrbanArea &&
    isExpressSupported(request.province, request.district)
  ) {
    results.push({
      MaPTVC: "VC05",
      TenPTVC: "Giao hàng hỏa tốc",
      PhiVanChuyen: Math.round(
        baseCost * 1.8 * areaMultiplier * timeMultiplier * request.totalWeight
      ),
      ThoiGianGiaoHang: "4-8 giờ",
      TocDo: "express",
      estimatedDelivery: calculateEstimatedDelivery("express"),
      isAvailable: isExpressAvailableNow(),
      UuDai: ["Ưu tiên xử lý", "Theo dõi real-time", "Hỗ trợ 24/7"],
    });

    // Chỉ thêm super express trong điều kiện đặc biệt
    if (isSuperExpressAvailable(request)) {
      results.push({
        MaPTVC: "VC06",
        TenPTVC: "Giao hàng siêu tốc",
        PhiVanChuyen: Math.round(
          baseCost * 3 * areaMultiplier * timeMultiplier * request.totalWeight
        ),
        ThoiGianGiaoHang: "1-2 giờ",
        TocDo: "super_express",
        estimatedDelivery: calculateEstimatedDelivery("super_express"),
        isAvailable: true,
        UuDai: [
          "Xử lý ưu tiên cao nhất",
          "Giám sát 24/7",
          "Hoàn tiền 100% nếu trễ",
        ],
      });
    }
  }

  return results;
};

const calculateBaseCost = (request: ShippingCalculationRequestOld): number => {
  const baseRates: { [key: string]: number } = {
    "Thành phố Hồ Chí Minh": 15000,
    "Thành phố Hà Nội": 16000,
    "Thành phố Đà Nẵng": 17000,
    "Thành phố Cần Thơ": 18000,
    "Thành phố Hải Phòng": 18000,
  };
  return baseRates[request.province] || 20000;
};

const getSpeedMultiplier = (
  speed: "standard" | "fast" | "express" | "super_express"
): number => {
  const multipliers = {
    standard: 1,
    fast: 1.3,
    express: 1.8,
    super_express: 3,
  };
  return multipliers[speed] || 1;
};

const calculateEstimatedDelivery = (speed: string): string => {
  const now = new Date();
  const deliveries = {
    standard: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    fast: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    express: new Date(now.getTime() + 8 * 60 * 60 * 1000),
    super_express: new Date(now.getTime() + 2 * 60 * 60 * 1000),
  };

  const deliveryTime =
    deliveries[speed as keyof typeof deliveries] || deliveries.standard;
  return deliveryTime.toLocaleString("vi-VN", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
};

const isExpressSupported = (province: string, district: string): boolean => {
  const supportedProvinces = [
    "Thành phố Hồ Chí Minh",
    "Thành phố Hà Nội",
    "Thành phố Đà Nẵng",
    "Thành phố Cần Thơ",
    "Thành phố Hải Phòng",
  ];

  const supportedDistricts = [
    "Quận 1",
    "Quận 3",
    "Quận 5",
    "Ba Đình",
    "Hoàn Kiếm",
    "Hải Châu",
  ];

  return (
    supportedProvinces.includes(province) &&
    supportedDistricts.some((d) => district.includes(d))
  );
};

const isExpressAvailableNow = (): boolean => {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 6 && hour <= 22;
};

const isSuperExpressAvailable = (
  request: ShippingCalculationRequestOld
): boolean => {
  const now = new Date();
  const hour = now.getHours();
  const isPeakHours = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19);
  return hour >= 8 && hour <= 20 && !isPeakHours && request.isUrbanArea;
};

const getExpressShippingFallback = (): ShippingMethod[] => {
  return [
    {
      MaPTVC: "VC05",
      TenPTVC: "Giao hàng hỏa tốc",
      PhiVanChuyen: 50000,
      ThoiGianGiaoHang: "4-8 giờ",
      TocDo: "express",
      isAvailable: true,
      UuDai: ["Ưu tiên xử lý", "Theo dõi real-time"],
      zone: "intra_city",
    },
    {
      MaPTVC: "VC06",
      TenPTVC: "Giao hàng siêu tốc",
      PhiVanChuyen: 80000,
      ThoiGianGiaoHang: "1-2 giờ",
      TocDo: "super_express",
      isAvailable: true,
      UuDai: ["Xử lý ưu tiên cao nhất", "Giám sát 24/7"],
      zone: "intra_city",
    },
  ];
};

const validateExpressOrderFallback = (data: any) => {
  const constraints: string[] = [];

  if (!isExpressSupported(data.province, data.district)) {
    constraints.push("Khu vực của bạn không hỗ trợ giao hàng tốc độ cao");
  }

  if (!isExpressAvailableNow()) {
    constraints.push("Dịch vụ tốc độ cao hiện không khả dụng (6:00 - 22:00)");
  }

  const totalWeight = data.items.reduce(
    (total: number, item: OrderItem) => total + item.SL * 0.5,
    0
  );
  if (totalWeight > 10) {
    constraints.push("Đơn hàng vượt quá trọng lượng cho phép (tối đa 10kg)");
  }

  return {
    isValid: constraints.length === 0,
    message:
      constraints.length > 0
        ? "Không thể áp dụng giao hàng tốc độ cao"
        : "Có thể áp dụng giao hàng tốc độ cao",
    constraints,
  };
};