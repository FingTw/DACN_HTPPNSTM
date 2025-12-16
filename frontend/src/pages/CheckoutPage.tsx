// src/pages/CheckoutPage.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { orderService } from "@/services/orderService";
import type {
  ProcessCheckoutData,
  ShippingCalculationResult,
  OrderItem as BaseOrderItem,
  PaymentMethod,
  ShippingMethod as BaseShippingMethod, // Import type mới
} from "@/services/orderService";
import { AddressInput } from "@/components/AddressInput";
import { ShippingSpeedSelector } from "@/components/shipping/ShippingSpeedSelector"; // Có thể giữ cho UI hoặc thay thế
import { khuyenMaiAPI, type KhuyenMaiDaNhan } from "@/services/khuyenmaiApi";
import { useAcceptProposal } from "@/hooks/useRFQ";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import PayPalButtonWrapper from "@/components/payment/PayPalButtonWrapper";

interface CheckoutProduct extends BaseOrderItem {
  MaSP: string;
  SL: number;
  TongTien: number;
  MaSP_sanpham: {
    MaSP: string;
    TenSP: string;
    GiaBan: number;
    HinhAnh?: string;
    SLTon?: number;
  };
}

interface CheckoutData {
  selectedItems: CheckoutProduct[];
  totalAmount: number;
  shippingFee: number;
}

// 🆕 Interface Shipping Method mới theo API mới
interface ShippingMethod {
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

interface Address {
  street: string;
  ward: string;
  district: string;
  province: string;
  fullAddress: string;
}

interface AppliedVouchers {
  shippingVoucher?: KhuyenMaiDaNhan;
  discountVoucher?: KhuyenMaiDaNhan;
}

interface DiscountResult {
  discountAmount: number;
  finalSubtotal: number;
  finalShippingFee: number;
  finalTotal: number;
  appliedVouchers: AppliedVouchers;
}

// 🆕 Interface cho API response
interface AvailableShippingResponse {
  success: boolean;
  data: {
    availableMethods: ShippingMethod[];
    zone: string;
    unavailableReasons: Record<string, string>;
  };
  message: string;
}

// 🆕 Interface cho Shipping Calculation Response mới
interface NewShippingCalculationResult {
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

const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { isRFQ, rfqData } = location.state || {};
  const { acceptProposal, loading: rfqLoading } = useAcceptProposal();

  const [loading, setLoading] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<BaseShippingMethod[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [address, setAddress] = useState<Address | null>(null);
  const [finalTotalAmount, setFinalTotalAmount] = useState(0);

  // 🆕 State mới cho shipping
  const [availableShippingMethods, setAvailableShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | null>(null);
  const [dynamicShippingFee, setDynamicShippingFee] = useState(0);
  const [shippingMethodsLoading, setShippingMethodsLoading] = useState(false);

  const [availableVouchers, setAvailableVouchers] = useState<KhuyenMaiDaNhan[]>([]);
  const [selectedVouchers, setSelectedVouchers] = useState<AppliedVouchers>({});
  const [vouchersLoading, setVouchersLoading] = useState(false);
  const [discountResult, setDiscountResult] = useState<DiscountResult>({
    discountAmount: 0,
    finalSubtotal: 0,
    finalShippingFee: 0,
    finalTotal: 0,
    appliedVouchers: {},
  });

  const [formData, setFormData] = useState({
    DCNhanHang: "",
    MaPTVC: "",
    MaPTTT: "",
  });

  const tempOrderIdRef = useRef<string | null>(null);
  const checkoutData = location.state as CheckoutData;

  const subtotal =
    checkoutData?.selectedItems.reduce((total, item) => {
      return total + item.SL * (item.MaSP_sanpham?.GiaBan || 0);
    }, 0) || 0;

  // Load địa chỉ
  useEffect(() => {
    const savedAddress = localStorage.getItem("savedShippingAddress");
    if (savedAddress) {
      try {
        const addressData: Address = JSON.parse(savedAddress);
        setAddress(addressData);
        setFormData((prev) => ({
          ...prev,
          DCNhanHang: addressData.fullAddress,
        }));
        // 🆕 Load shipping methods khi có địa chỉ đã lưu
        if (addressData.fullAddress) {
          fetchAvailableShippingMethods(addressData.fullAddress);
        }
      } catch (error) {
        console.error("Lỗi khi parse địa chỉ:", error);
      }
    }
  }, []);

  // 🆕 Hàm lấy shipping methods khả dụng
  const fetchAvailableShippingMethods = async (deliveryAddress: string) => {
    if (!deliveryAddress.trim()) return;
    
    setShippingMethodsLoading(true);
    try {
      // 🆕 Sử dụng API mới: POST /shipping/methods
      const response = await orderService.getAvailableShippingMethods(deliveryAddress);
      
      if (response.success && response.data?.availableMethods) {
        setAvailableShippingMethods(response.data.availableMethods);
        
        // Tự động chọn phương thức đầu tiên nếu có
        if (response.data.availableMethods.length > 0) {
          const firstMethod = response.data.availableMethods[0];
          handleShippingSelect(firstMethod);
        }
      } else {
        setAvailableShippingMethods([]);
      }
    } catch (error: any) {
      console.error("Lỗi khi lấy phương thức vận chuyển:", error);
      toast.error(error.message || "Không thể lấy phương thức vận chuyển");
      setAvailableShippingMethods([]);
    } finally {
      setShippingMethodsLoading(false);
    }
  };

  // 🆕 Hàm tính phí vận chuyển cho một phương thức cụ thể
  const calculateShippingForMethod = async (deliveryType: string) => {
    if (!address?.fullAddress || !deliveryType) return;
    
    try {
      // 🆕 Sử dụng API mới: POST /calculate-shipping
      const response = await orderService.calculateShippingFee({
        deliveryAddress: address.fullAddress,
        items: checkoutData?.selectedItems.map(item => ({
          MaSP: item.MaSP,
          SL: item.SL,
          GiaBan: item.MaSP_sanpham?.GiaBan || 0
        })) || [],
        deliveryType: deliveryType
      });
      
      if (response.success && response.data) {
        return response.data.deliveryFee;
      }
      return 0;
    } catch (error) {
      console.error("Lỗi tính phí vận chuyển:", error);
      return 0;
    }
  };

  // 🆕 Hàm validate phương thức vận chuyển
  const validateShippingMethod = async (deliveryType: string) => {
    if (!address?.fullAddress) return false;
    
    try {
      const response = await orderService.validateShippingMethod({
        deliveryAddress: address.fullAddress,
        deliveryType: deliveryType
      });
      
      return response.success;
    } catch (error) {
      console.error("Lỗi validate phương thức vận chuyển:", error);
      return false;
    }
  };

  // Load khuyến mãi
  useEffect(() => {
    const loadAvailableVouchers = async () => {
      try {
        setVouchersLoading(true);
        const response = await khuyenMaiAPI.getKhuyenMaiDaNhan();
        const validVouchers = response.data.filter((voucher) => {
          if (!voucher.MaKM_khuyenmai) return false;
          const now = new Date();
          const endDate = new Date(voucher.MaKM_khuyenmai.NgayKetThuc);
          const isExpired = endDate < now;
          const hasUsageLimit = voucher.MaKM_khuyenmai.GioiHanSuDung > 0;
          const isUsageExceeded =
            hasUsageLimit &&
            voucher.SoLanSuDung >= voucher.MaKM_khuyenmai.GioiHanSuDung;
          return !isExpired && !isUsageExceeded;
        });
        setAvailableVouchers(validVouchers);
      } catch (error) {
        console.error("Lỗi tải khuyến mãi:", error);
      } finally {
        setVouchersLoading(false);
      }
    };
    if (user) loadAvailableVouchers();
  }, [user]);

  // Load phương thức thanh toán & THÊM PAYPAL
  useEffect(() => {
    const fetchMethods = async () => {
      try {
        setMethodsLoading(true);
        let methods = await orderService.getPaymentMethods();

        if (!methods || methods.length === 0) {
          methods = [
            { MaPTTT: "TT01", TenPTTT: "Thanh toán khi nhận hàng (COD)" },
            { MaPTTT: "TT02", TenPTTT: "Chuyển khoản ngân hàng" },
          ];
        }

        // 🟢 THÊM PAYPAL VÀO DANH SÁCH NẾU CHƯA CÓ
        if (!methods.find((m) => m.MaPTTT === "PAYPAL")) {
          methods.push({
            MaPTTT: "PAYPAL",
            TenPTTT: "Thanh toán qua PayPal (Visa/MasterCard)",
          });
        }

        setPaymentMethods(methods);
        // Mặc định chọn cái đầu tiên
        setFormData((prev) => ({ ...prev, MaPTTT: methods[0].MaPTTT }));
      } catch (error) {
        console.error("Lỗi lấy phương thức:", error);
      } finally {
        setMethodsLoading(false);
      }
    };
    fetchMethods();
  }, []);

  // Tính toán khuyến mãi
  const calculateDiscounts = useCallback(
    (
      currentSubtotal: number,
      currentShippingFee: number,
      vouchers: AppliedVouchers
    ) => {
      let discountAmount = 0;
      let finalSubtotal = currentSubtotal;
      let finalShippingFee = currentShippingFee;
      const appliedVouchers: AppliedVouchers = { ...vouchers };

      Object.entries(vouchers).forEach(([type, voucher]) => {
        if (!voucher?.MaKM_khuyenmai) return;
        const km = voucher.MaKM_khuyenmai;

        if (km.DieuKien && km.DieuKien > currentSubtotal) {
          if (type === "shippingVoucher")
            appliedVouchers.shippingVoucher = undefined;
          else appliedVouchers.discountVoucher = undefined;
          toast.error(
            `Voucher "${
              km.TenKM
            }" yêu cầu đơn tối thiểu ${km.DieuKien.toLocaleString("vi-VN")}đ`
          );
          return;
        }

        switch (km.LoaiKM) {
          case "SHIPPING":
          case "FREESHIP":
            if (km.HinhThucGiam === "PERCENTAGE") {
              const discount = finalShippingFee * (km.GiaTriGiam / 100);
              const maxDiscount = km.SoTienGiamToiDa || discount;
              const actualDiscount = Math.min(discount, maxDiscount);
              discountAmount += actualDiscount;
              finalShippingFee = Math.max(0, finalShippingFee - actualDiscount);
            } else {
              discountAmount += km.GiaTriGiam;
              finalShippingFee = Math.max(0, finalShippingFee - km.GiaTriGiam);
            }
            break;
          case "ALL":
          case "CATEGORY":
          case "PRODUCT":
            if (km.HinhThucGiam === "PERCENTAGE") {
              const discount = finalSubtotal * (km.GiaTriGiam / 100);
              const maxDiscount = km.SoTienGiamToiDa || discount;
              const actualDiscount = Math.min(discount, maxDiscount);
              discountAmount += actualDiscount;
              finalSubtotal = Math.max(0, finalSubtotal - actualDiscount);
            } else {
              discountAmount += km.GiaTriGiam;
              finalSubtotal = Math.max(0, finalSubtotal - km.GiaTriGiam);
            }
            break;
        }
      });

      const finalTotal = finalSubtotal + finalShippingFee;
      return {
        discountAmount,
        finalSubtotal,
        finalShippingFee,
        finalTotal,
        appliedVouchers,
      };
    },
    []
  );

  useEffect(() => {
    const result = calculateDiscounts(
      subtotal,
      dynamicShippingFee,
      selectedVouchers
    );
    setDiscountResult(result);
    setFinalTotalAmount(result.finalTotal);
  }, [selectedVouchers, subtotal, dynamicShippingFee, calculateDiscounts]);

  // 🆕 Cập nhật handleAddressSelect
  const handleAddressSelect = useCallback((selectedAddress: Address) => {
    setAddress(selectedAddress);
    localStorage.setItem(
      "savedShippingAddress",
      JSON.stringify(selectedAddress)
    );
    const fullAddress = selectedAddress.fullAddress;
    setFormData((prev) => ({
      ...prev,
      DCNhanHang: fullAddress,
    }));
    
    // 🆕 Load shipping methods khi chọn địa chỉ mới
    fetchAvailableShippingMethods(fullAddress);
  }, []);

  // 🆕 Cập nhật handleShippingSelect
  const handleShippingSelect = useCallback(async (shipping: ShippingMethod) => {
    setSelectedShippingMethod(shipping);
    setDynamicShippingFee(shipping.PhiVanChuyen);
    setFormData((prev) => ({ ...prev, MaPTVC: shipping.MaPTVC }));
    
    // 🆕 Validate phương thức đã chọn
    const isValid = await validateShippingMethod(shipping.TocDo);
    if (!isValid) {
      toast.error(`Phương thức ${shipping.TenPTVC} không thể áp dụng cho địa chỉ này`);
      return;
    }
    
    toast.success(`Đã chọn: ${shipping.TenPTVC}`);
  }, [address]);

  useEffect(() => {
    if (
      !checkoutData?.selectedItems ||
      checkoutData.selectedItems.length === 0
    ) {
      toast.error("Không có sản phẩm để thanh toán");
      navigate("/cart");
    }
  }, [checkoutData, navigate]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleVoucher = (voucher: KhuyenMaiDaNhan) => {
    const km = voucher.MaKM_khuyenmai;
    if (!km) return;
    const isShippingVoucher =
      km.LoaiKM === "SHIPPING" || km.LoaiKM === "FREESHIP";
    const voucherType = isShippingVoucher
      ? "shippingVoucher"
      : "discountVoucher";

    setSelectedVouchers((prev) => {
      const newVouchers = { ...prev };
      if (newVouchers[voucherType]?.MaKM === voucher.MaKM) {
        newVouchers[voucherType] = undefined;
        toast.info(`Đã bỏ chọn voucher: ${km.TenKM}`);
      } else {
        if (isShippingVoucher && newVouchers.shippingVoucher) {
          toast.error("Chỉ được chọn 1 voucher vận chuyển");
          return prev;
        }
        if (!isShippingVoucher && newVouchers.discountVoucher) {
          toast.error("Chỉ được chọn 1 voucher giảm giá sản phẩm");
          return prev;
        }
        newVouchers[voucherType] = voucher;
        toast.success(`Đã áp dụng voucher: ${km.TenKM}`);
      }
      return newVouchers;
    });
  };

  // 🟢 HÀM KIỂM TRA VALIDATION CHUNG
  const validateOrder = (): boolean => {
    if (!formData.DCNhanHang.trim()) {
      toast.error("Vui lòng nhập địa chỉ nhận hàng");
      return false;
    }
    if (!selectedShippingMethod) {
      toast.error("Vui lòng chọn phương thức vận chuyển");
      return false;
    }
    return true;
  };

  // 🟢 HÀM TẠO PAYLOAD ĐƠN HÀNG (CẬP NHẬT VỚI deliveryType)
  const createOrderPayload = () => {
    const processedItems = checkoutData.selectedItems.map((item) => ({
      MaSP: item.MaSP.trim(),
      SL: item.SL,
      GiaBan: item.MaSP_sanpham?.GiaBan || 0,
    }));

    return {
      DCNhanHang: formData.DCNhanHang.trim(),
      MaPTVC: formData.MaPTVC,
      deliveryType: selectedShippingMethod?.TocDo || "standard", // 🆕 Thêm deliveryType
      MaPTTT: formData.MaPTTT === "PAYPAL" ? "TT02" : formData.MaPTTT,
      TongTien: discountResult.finalTotal,
      items: processedItems,
      PhiVanChuyen: dynamicShippingFee,
      appliedVouchers: Object.values(selectedVouchers)
        .filter(Boolean)
        .map((voucher) => voucher!.MaKM),
    };
  };

  // 🟢 HÀM XỬ LÝ THANH TOÁN THƯỜNG (COD, BANK)
  const handleCheckout = async () => {
    if (!validateOrder()) return;

    // Validation item
    const validationErrors: string[] = [];
    checkoutData.selectedItems.forEach((item) => {
      if (!item.MaSP || item.MaSP.trim() === "")
        validationErrors.push("Mã sản phẩm không hợp lệ");
      if (!item.SL || item.SL < 1)
        validationErrors.push(`Số lượng sản phẩm ${item.MaSP} không hợp lệ`);
    });
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    setLoading(true);
    try {
      if (isRFQ && rfqData) {
        // Logic RFQ
        await acceptProposal({
          MaDNCC: rfqData.MaDNCC,
          SoLuongMua: checkoutData.selectedItems[0].SL,
          GhiChu: "Đơn hàng từ RFQ",
          DCNhanHang: formData.DCNhanHang.trim(),
          MaPTVC: formData.MaPTVC,
          MaPTTT: formData.MaPTTT,
          PhiVanChuyen: dynamicShippingFee,
        });
        toast.success("Chấp nhận đề nghị thành công!");
        setTimeout(() => (window.location.href = "/orders"), 1500);
      } else {
        // Logic Đơn thường
        const payload = createOrderPayload();
        const result = await orderService.processCheckout(payload);
        if (result && result.MaDH) {
          toast.success("Đặt hàng thành công!");
          setTimeout(
            () => (window.location.href = `/order-success/${result.MaDH}`),
            1000
          );
        }
      }
    } catch (error: any) {
      console.error("Lỗi thanh toán:", error);
      toast.error(error.message || "Đặt hàng thất bại");
    } finally {
      setLoading(false);
    }
  };

  // 🟢 HÀM ĐƯỢC GỌI BỞI NÚT PAYPAL ĐỂ TẠO ĐƠN TRƯỚC KHI POPUP
  const handleCreateOrderForPayPal = async (): Promise<string | null> => {
    if (!validateOrder()) return null;

    try {
      const payload = createOrderPayload();
      const result = await orderService.processCheckout(payload);

      if (result && result.MaDH) {
        tempOrderIdRef.current = result.MaDH;
        return result.MaDH;
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể tạo đơn hàng cho PayPal");
    }
    return null;
  };

  // 🟢 HÀM XỬ LÝ KHI PAYPAL THÀNH CÔNG
  const handlePayPalSuccess = (payPalOrderId: string) => {
    const MaDH = tempOrderIdRef.current;
    toast.success("Thanh toán PayPal thành công!");
    if (MaDH) {
      window.location.href = `/order-success/${MaDH}`;
    } else {
      window.location.href = "/orders";
    }
  };

  // 🆕 Hàm render phương thức vận chuyển
  const renderShippingMethods = () => {
    if (shippingMethodsLoading) {
      return <p className="text-gray-500">Đang tải phương thức vận chuyển...</p>;
    }

    if (!address?.fullAddress) {
      return <p className="text-gray-500">Vui lòng chọn địa chỉ để xem phương thức vận chuyển.</p>;
    }

    if (availableShippingMethods.length === 0) {
      return <p className="text-gray-500">Không có phương thức vận chuyển khả dụng cho địa chỉ này.</p>;
    }

    return (
      <div className="space-y-3">
        {availableShippingMethods.map((method) => (
          <div
            key={method.MaPTVC}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedShippingMethod?.MaPTVC === method.MaPTVC
                ? "border-green-500 bg-green-50 shadow-sm"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handleShippingSelect(method)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{method.TenPTVC}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    method.TocDo === 'super_express' ? 'bg-red-100 text-red-800' :
                    method.TocDo === 'express' ? 'bg-orange-100 text-orange-800' :
                    method.TocDo === 'fast' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {method.TocDo}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Thời gian:</span> {method.ThoiGianGiaoHang}
                </p>
                {method.UuDai && method.UuDai.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {method.UuDai.map((benefit, index) => (
                      <span
                        key={index}
                        className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                      >
                        {benefit}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600 text-lg">
                  {method.PhiVanChuyen.toLocaleString("vi-VN")}đ
                </p>
                <p className="text-xs text-gray-500 mt-1">{method.zone}</p>
              </div>
            </div>
            {selectedShippingMethod?.MaPTVC === method.MaPTVC && (
              <div className="mt-2 pt-2 border-t border-green-200">
                <p className="text-xs text-green-600">
                  ✓ Đã chọn • {method.metadata?.pricingSource}
                </p>
              </div>
            )}
          </div>
        ))}
        
        {/* Hiển thị lý do không khả dụng nếu có */}
        {availableShippingMethods.some(m => !m.isAvailable) && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              ⚠️ Một số phương thức không khả dụng cho địa chỉ này
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Thanh Toán</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Danh sách sản phẩm */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Sản phẩm đã chọn</h2>
                <div className="space-y-4">
                  {checkoutData?.selectedItems.map((item) => (
                    <div
                      key={item.MaSP}
                      className="flex gap-4 border-b pb-4 last:border-b-0"
                    >
                      <img
                        src={
                          item.MaSP_sanpham.HinhAnh ||
                          "/placeholder-product.jpg"
                        }
                        alt={item.MaSP_sanpham.TenSP}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {item.MaSP_sanpham.TenSP}
                        </h3>
                        <p className="text-gray-600 text-sm">SL: {item.SL}</p>
                        <p className="text-green-600 font-semibold">
                          {item.TongTien.toLocaleString("vi-VN")}đ
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Khuyến mãi */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Khuyến Mãi</h2>
                {vouchersLoading ? (
                  <p>Đang tải...</p>
                ) : (
                  <div className="space-y-2">
                    {availableVouchers.map((voucher) => (
                      <div
                        key={voucher.MaKM}
                        onClick={() => toggleVoucher(voucher)}
                        className={`p-3 border rounded cursor-pointer ${
                          selectedVouchers.shippingVoucher?.MaKM ===
                            voucher.MaKM ||
                          selectedVouchers.discountVoucher?.MaKM ===
                            voucher.MaKM
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200"
                        }`}
                      >
                        <p className="font-bold">
                          {voucher.MaKM_khuyenmai?.TenKM}
                        </p>
                        <p className="text-sm text-gray-500">
                          {voucher.MaKM_khuyenmai?.MoTa}
                        </p>
                      </div>
                    ))}
                    {availableVouchers.length === 0 && (
                      <p className="text-gray-500 text-sm">
                        Không có khuyến mãi khả dụng.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Thông tin giao hàng */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Thông tin giao hàng
                </h2>
                <div className="space-y-4">
                  <AddressInput
                    onAddressSelect={handleAddressSelect}
                    required
                  />

                  {/* 🆕 Hiển thị phương thức vận chuyển mới */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phương thức vận chuyển
                    </label>
                    {renderShippingMethods()}
                  </div>

                  {/* 🟢 SELECT PHƯƠNG THỨC THANH TOÁN */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phương thức thanh toán
                    </label>
                    <select
                      name="MaPTTT"
                      value={formData.MaPTTT}
                      onChange={handleInputChange}
                      disabled={methodsLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                    >
                      {methodsLoading ? (
                        <option>Đang tải...</option>
                      ) : (
                        paymentMethods.map((method) => (
                          <option key={method.MaPTTT} value={method.MaPTTT}>
                            {method.TenPTTT}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột Phải: Tổng kết */}
            <div className="bg-white rounded-lg shadow-sm p-6 h-fit sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Tổng kết đơn hàng</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span>
                  <span>{subtotal.toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span>
                    {selectedShippingMethod
                      ? `${dynamicShippingFee.toLocaleString("vi-VN")}đ`
                      : "Chưa chọn"}
                  </span>
                </div>
                {discountResult.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá</span>
                    <span>
                      -{discountResult.discountAmount.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                )}
                <hr className="my-2" />
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Tổng cộng</span>
                  <span className="text-green-600">
                    {discountResult.finalTotal.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>

              {/* Thông tin phương thức đã chọn */}
              {selectedShippingMethod && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Phương thức đã chọn</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-green-700">{selectedShippingMethod.TenPTVC}</p>
                      <p className="text-sm text-green-600">{selectedShippingMethod.ThoiGianGiaoHang}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-700">
                        {selectedShippingMethod.PhiVanChuyen.toLocaleString("vi-VN")}đ
                      </p>
                      <p className="text-xs text-green-600">{selectedShippingMethod.zone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 🟢 HIỂN THỊ NÚT THANH TOÁN */}
              {formData.MaPTTT === "PAYPAL" ? (
                <div className="mt-4">
                  <p className="text-sm text-center text-gray-500 mb-2">
                    Nhấn vào nút dưới để thanh toán an toàn qua PayPal
                  </p>
                  <PayPalButtonWrapper
                    amount={discountResult.finalTotal}
                    createOrderInDB={handleCreateOrderForPayPal}
                    onSuccess={handlePayPalSuccess}
                  />
                </div>
              ) : (
                <button
                  onClick={handleCheckout}
                  disabled={loading || !selectedShippingMethod}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    loading || !selectedShippingMethod
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {loading
                    ? "Đang xử lý..."
                    : `Xác nhận đặt hàng - ${discountResult.finalTotal.toLocaleString(
                        "vi-VN"
                      )}đ`}
                </button>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span>Đảm bảo chất lượng 100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CheckoutPage;