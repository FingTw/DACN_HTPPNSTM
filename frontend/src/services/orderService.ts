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

export interface ShippingMethod {
  MaPTVC: string;
  TenPTVC: string;
  PhiVanChuyen?: number;
  ThoiGianGiaoHang?: string;
  TocDo?: "standard" | "fast" | "express" | "super_express";
}

export interface PaymentMethod {
  MaPTTT: string;
  TenPTTT: string;
}

// ============================================
// SHIPPING CALCULATION TYPES
// ============================================

export interface ShippingCalculationRequest {
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
// ORDER SERVICE - VẬN CHUYỂN TỐC ĐỘ CAO
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
  ): Promise<Order | null> => {
    try {
      console.log("🔄 Calling endpoint: POST /order/process-checkout");
      console.log("📦 Payload:", {
        ...data,
        items: data.items.map((item) => ({ MaSP: item.MaSP, SL: item.SL })),
      });

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

      if (response.data.data) {
        console.log("✅ Backend returned data:", response.data.data);
        return response.data.data;
      }

      // Trường hợp backend trả về data trực tiếp (không wrap)
      if (response.data.MaDH) {
        console.log("✅ Backend returned direct order data");
        return response.data;
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
      const response = await api.get<ApiResponse<Order[]>>("/order/my-orders");
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

  // 7. Lấy danh sách phương thức vận chuyển
  getShippingMethods: async (): Promise<ShippingMethod[] | null> => {
    try {
      const response = await api.get<ApiResponse<ShippingMethod[]>>(
        "/order/shipping-methods"
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi lấy phương thức vận chuyển:", error);
      return [
        {
          MaPTVC: "VC01",
          TenPTVC: "Giao hàng tiêu chuẩn",
          PhiVanChuyen: 30000,
          ThoiGianGiaoHang: "2-3 ngày",
          TocDo: "standard",
        },
        {
          MaPTVC: "VC02",
          TenPTVC: "Giao hàng nhanh",
          PhiVanChuyen: 50000,
          ThoiGianGiaoHang: "24 giờ",
          TocDo: "fast",
        },
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
      return [
        { MaPTTT: "TT01", TenPTTT: "Thanh toán khi nhận hàng (COD)" },
        { MaPTTT: "TT02", TenPTTT: "Chuyển khoản ngân hàng" },
      ];
    }
  },

  // 🆕 9. Tính toán phí vận chuyển theo tốc độ
  calculateShipping: async (
    request: ShippingCalculationRequest
  ): Promise<ShippingCalculationResult[] | null> => {
    try {
      console.log("🚀 Gửi request tính phí VC:", request);

      const response = await api.post<ApiResponse<ShippingCalculationResult[]>>(
        "/order/calculate-shipping",
        {
          deliveryAddress: request.province + ", " + request.district, // Gửi full address
          items: request.items,
          deliverySpeed: request.deliverySpeed || "standard", // Đảm bảo có giá trị mặc định
        }
      );

      console.log("✅ Phản hồi từ server:", response.data);
      return response.data.data;
    } catch (error: any) {
      console.error("❌ Lỗi tính phí vận chuyển:", error);
      console.error("❌ Chi tiết lỗi:", error.response?.data);
      return await calculateShippingFallback(request);
    }
  },

  // 🆕 10. Lấy phương thức vận chuyển tốc độ cao
  getExpressShippingMethods: async (): Promise<ShippingMethod[] | null> => {
    try {
      const response = await api.get<ApiResponse<ShippingMethod[]>>(
        "/order/express-shipping-methods"
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi lấy phương thức vận chuyển tốc độ cao:", error);
      return getExpressShippingFallback();
    }
  },

  // 🆕 11. Kiểm tra tính khả thi của đơn hàng tốc độ cao
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
      const response = await api.post<
        ApiResponse<{
          isValid: boolean;
          message?: string;
          constraints?: string[];
        }>
      >("/order/validate-express", data);
      return response.data.data;
    } catch (error: any) {
      console.error("Lỗi validate đơn hàng tốc độ cao:", error);
      return validateExpressOrderFallback(data);
    }
  },
};

// ============================================
// FALLBACK IMPLEMENTATIONS
// ============================================

const calculateShippingFallback = async (
  request: ShippingCalculationRequest
): Promise<ShippingCalculationResult[]> => {
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

const calculateBaseCost = (request: ShippingCalculationRequest): number => {
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
  request: ShippingCalculationRequest
): boolean => {
  const now = new Date();
  const hour = now.getHours();
  const isPeakHours = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19);
  return hour >= 8 && hour <= 20 && !isPeakHours && request.isUrbanArea;
};

const getExpressShippingFallback = (): ShippingMethod[] => {
  return [
    {
      MaPTVC: "VC01",
      TenPTVC: "Giao hàng hỏa tốc",
      PhiVanChuyen: 50000,
      ThoiGianGiaoHang: "4-8 giờ",
      TocDo: "express",
    },
    {
      MaPTVC: "VC02",
      TenPTVC: "Giao hàng siêu tốc",
      PhiVanChuyen: 80000,
      ThoiGianGiaoHang: "1-2 giờ",
      TocDo: "super_express",
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
