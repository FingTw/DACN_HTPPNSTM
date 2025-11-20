// src/pages/CheckoutPage.tsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { orderService } from "@/services/orderService";
import type {
  ProcessCheckoutData,
  ShippingCalculationResult,
  OrderItem as BaseOrderItem,
} from "@/services/orderService";
import { AddressInput } from "@/components/AddressInput";
import { ShippingSpeedSelector } from "@/components/shipping/ShippingSpeedSelector";
import { useCallback } from "react";
import { khuyenMaiAPI, type KhuyenMaiDaNhan } from "@/services/khuyenmaiApi";
import { useAcceptProposal } from "@/hooks/useRFQ";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

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

interface ShippingMethod {
  MaPTVC: string;
  TenPTVC: string;
  PhiVanChuyen?: number;
}

interface PaymentMethod {
  MaPTTT: string;
  TenPTTT: string;
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

const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { isRFQ, rfqData } = location.state || {};
  const { acceptProposal, loading: rfqLoading } = useAcceptProposal();

  const [loading, setLoading] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [address, setAddress] = useState<Address | null>(null);
  const [finalTotalAmount, setFinalTotalAmount] = useState(0);

  // State mới cho vận chuyển tốc độ cao
  const [selectedShippingMethod, setSelectedShippingMethod] =
    useState<ShippingCalculationResult | null>(null);
  const [dynamicShippingFee, setDynamicShippingFee] = useState(0);

  // State cho khuyến mãi
  const [availableVouchers, setAvailableVouchers] = useState<KhuyenMaiDaNhan[]>(
    []
  );
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

  // Lấy dữ liệu từ CartPage
  const checkoutData = location.state as CheckoutData;

  // Tính subtotal (chỉ tiền sản phẩm)
  const subtotal = checkoutData.selectedItems.reduce((total, item) => {
    return total + item.SL * (item.MaSP_sanpham?.GiaBan || 0);
  }, 0);

  // Load địa chỉ đã lưu từ localStorage
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
        console.log("📍 Đã tải địa chỉ từ storage:", addressData);
      } catch (error) {
        console.error("Lỗi khi parse địa chỉ từ storage:", error);
      }
    }
  }, []);

  // Load khuyến mãi đã nhận
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

    if (user) {
      loadAvailableVouchers();
    }
  }, [user]);

  // Lấy danh sách phương thức thanh toán (giữ lại payment methods)
  useEffect(() => {
    const fetchMethods = async () => {
      try {
        setMethodsLoading(true);

        // Lấy phương thức thanh toán
        const paymentData = await orderService.getPaymentMethods();
        if (paymentData && paymentData.length > 0) {
          setPaymentMethods(paymentData);
          setFormData((prev) => ({ ...prev, MaPTTT: paymentData[0].MaPTTT }));
        } else {
          setPaymentMethods([
            { MaPTTT: "TT01", TenPTTT: "Thanh toán khi nhận hàng (COD)" },
            { MaPTTT: "TT02", TenPTTT: "Chuyển khoản ngân hàng" },
          ]);
          setFormData((prev) => ({ ...prev, MaPTTT: "TT01" }));
        }
      } catch (error) {
        console.error("Lỗi lấy phương thức:", error);
        setPaymentMethods([
          { MaPTTT: "TT01", TenPTTT: "Thanh toán khi nhận hàng (COD)" },
          { MaPTTT: "TT02", TenPTTT: "Chuyển khoản ngân hàng" },
        ]);
        setFormData((prev) => ({ ...prev, MaPTTT: "TT01" }));
      } finally {
        setMethodsLoading(false);
      }
    };

    fetchMethods();
  }, []);

  // Hàm tính toán khuyến mãi
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
          if (type === "shippingVoucher") {
            appliedVouchers.shippingVoucher = undefined;
          } else {
            appliedVouchers.discountVoucher = undefined;
          }
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

  // Tính toán lại khi có thay đổi
  useEffect(() => {
    const result = calculateDiscounts(
      subtotal,
      dynamicShippingFee,
      selectedVouchers
    );
    setDiscountResult(result);
    setFinalTotalAmount(result.finalTotal);
  }, [selectedVouchers, subtotal, dynamicShippingFee, calculateDiscounts]);

  const handleAddressSelect = useCallback((selectedAddress: Address) => {
    console.log("📍 Địa chỉ đã chọn (CheckoutPage):", selectedAddress);
    setAddress(selectedAddress);

    localStorage.setItem(
      "savedShippingAddress",
      JSON.stringify(selectedAddress)
    );

    setFormData((prev) => ({
      ...prev,
      DCNhanHang: selectedAddress.fullAddress,
    }));

    console.log("📍 Đã lưu địa chỉ vào storage:", selectedAddress);
  }, []);

  // Xử lý chọn phương thức vận chuyển
  const handleShippingSelect = useCallback(
    (shipping: ShippingCalculationResult) => {
      console.log("🚚 Selected shipping method:", shipping);
      setSelectedShippingMethod(shipping);
      setDynamicShippingFee(shipping.PhiVanChuyen);

      setFormData((prev) => ({
        ...prev,
        MaPTVC: shipping.MaPTVC,
      }));
    },
    []
  );

  // Khởi tạo giá trị ban đầu
  useEffect(() => {
    if (checkoutData?.selectedItems) {
      console.log("🔄 Khởi tạo giá trị checkout...");

      const calculatedSubtotal = checkoutData.selectedItems.reduce(
        (total, item) => {
          return total + item.SL * (item.MaSP_sanpham?.GiaBan || 0);
        },
        0
      );

      console.log("💰 Khởi tạo thành công:", {
        subtotal: calculatedSubtotal,
        hasSavedAddress: !!address,
      });
    }
  }, [checkoutData, address]);

  // Kiểm tra dữ liệu checkout và điều hướng
  useEffect(() => {
    if (
      !checkoutData?.selectedItems ||
      checkoutData.selectedItems.length === 0
    ) {
      toast.error("Không có sản phẩm để thanh toán");
      navigate("/cart");
      return;
    }

    console.log("✅ Dữ liệu checkout hợp lệ");
  }, [checkoutData, navigate]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Hàm chọn/bỏ chọn voucher
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

  // Hàm hiển thị giá trị giảm giá
  const getDiscountText = (voucher: KhuyenMaiDaNhan) => {
    const km = voucher.MaKM_khuyenmai;
    if (!km) return "";

    if (km.HinhThucGiam === "PERCENTAGE") {
      return `Giảm ${km.GiaTriGiam}%${
        km.SoTienGiamToiDa
          ? ` (tối đa ${km.SoTienGiamToiDa.toLocaleString("vi-VN")}đ)`
          : ""
      }`;
    } else {
      return `Giảm ${km.GiaTriGiam.toLocaleString("vi-VN")}đ`;
    }
  };

  const handleCheckout = async () => {
    if (!formData.DCNhanHang.trim()) {
      toast.error("Vui lòng nhập địa chỉ nhận hàng");
      return;
    }

    if (!selectedShippingMethod) {
      toast.error("Vui lòng chọn phương thức vận chuyển");
      return;
    }

    // VALIDATION
    const validationErrors: string[] = [];

    checkoutData.selectedItems.forEach((item) => {
      if (!item.MaSP || item.MaSP.trim() === "") {
        validationErrors.push("Mã sản phẩm không hợp lệ");
      }
      if (!item.SL || item.SL < 1 || !Number.isInteger(item.SL)) {
        validationErrors.push(
          `Số lượng sản phẩm ${item.MaSP || "unknown"} không hợp lệ`
        );
      }
      if (!item.MaSP_sanpham) {
        validationErrors.push(`Thông tin sản phẩm ${item.MaSP} không tồn tại`);
        return;
      }
      if (!item.MaSP_sanpham.GiaBan || item.MaSP_sanpham.GiaBan <= 0) {
        validationErrors.push(
          `Giá sản phẩm ${item.MaSP_sanpham.TenSP || item.MaSP} không hợp lệ`
        );
      }
    });

    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    setLoading(true);
    try {
      // 🟢 LOGIC RẼ NHÁNH: Kiểm tra xem đây là đơn RFQ hay đơn thường
      if (isRFQ && rfqData) {
        // === TRƯỜNG HỢP 1: ĐƠN HÀNG TỪ RFQ ===
        console.log("🚀 Đang xử lý đơn hàng RFQ...");

        await acceptProposal({
          MaDNCC: rfqData.MaDNCC,
          SoLuongMua: checkoutData.selectedItems[0].SL, // Lấy số lượng từ item đang hiển thị
          GhiChu: "Đơn hàng được tạo từ yêu cầu báo giá (RFQ)",
          DCNhanHang: formData.DCNhanHang.trim(),
          MaPTVC: formData.MaPTVC,
          MaPTTT: formData.MaPTTT,
          PhiVanChuyen: dynamicShippingFee, // Phí vận chuyển đã tính toán
        });

        toast.success("🎉 Chấp nhận đề nghị & Tạo đơn hàng thành công!");

        // Chuyển hướng chậm lại chút để user đọc thông báo
        setTimeout(() => {
          window.location.href = "/orders"; // Hoặc trang thành công
        }, 1500);
      } else {
        // === TRƯỜNG HỢP 2: ĐƠN HÀNG GIỎ HÀNG BÌNH THƯỜNG (CODE CŨ) ===
        console.log("🛒 Đang xử lý đơn hàng thường...");

        const processedItems = checkoutData.selectedItems.map((item) => ({
          MaSP: item.MaSP.trim(),
          SL: item.SL,
          GiaBan: item.MaSP_sanpham?.GiaBan || 0,
        }));

        const checkoutPayload = {
          DCNhanHang: formData.DCNhanHang.trim(),
          MaPTVC: formData.MaPTVC,
          MaPTTT: formData.MaPTTT,
          TongTien: discountResult.finalTotal,
          items: processedItems,
          appliedVouchers: Object.values(selectedVouchers)
            .filter(Boolean)
            .map((voucher) => voucher!.MaKM),
        };

        const result = await orderService.processCheckout(checkoutPayload);

        if (result && result.MaDH) {
          toast.success("🎉 Đặt hàng thành công!");
          setTimeout(() => {
            window.location.href = `/order-success/${result.MaDH}`;
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error("❌ Lỗi thanh toán:", error);
      toast.error(error.message || "Đặt hàng thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Thanh Toán</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Sản phẩm đã chọn</h2>
                <div className="space-y-4">
                  {checkoutData.selectedItems.map((item) => (
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
                        <p className="text-gray-600 text-sm">
                          Số lượng: {item.SL}
                        </p>
                        <p className="text-green-600 font-semibold">
                          {item.TongTien.toLocaleString("vi-VN")}đ
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Component Khuyến Mãi */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Khuyến Mãi</h2>

                {vouchersLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Đang tải khuyến mãi...</p>
                  </div>
                ) : availableVouchers.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-3">
                      Chọn tối đa 2 voucher (1 vận chuyển + 1 giảm giá sản phẩm)
                    </p>

                    {availableVouchers.map((voucher) => {
                      const km = voucher.MaKM_khuyenmai;
                      if (!km) return null;

                      const isShipping =
                        km.LoaiKM === "SHIPPING" || km.LoaiKM === "FREESHIP";
                      const isSelected = isShipping
                        ? selectedVouchers.shippingVoucher?.MaKM ===
                          voucher.MaKM
                        : selectedVouchers.discountVoucher?.MaKM ===
                          voucher.MaKM;

                      return (
                        <div
                          key={`${voucher.MaKM}-${voucher.MaTK}`}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            isSelected
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => toggleVoucher(voucher)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">
                                {km.TenKM}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {km.MoTa}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>{getDiscountText(voucher)}</span>
                                <span>•</span>
                                <span>
                                  HSD:{" "}
                                  {new Date(km.NgayKetThuc).toLocaleDateString(
                                    "vi-VN"
                                  )}
                                </span>
                                {km.DieuKien > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      Đơn tối thiểu:{" "}
                                      {km.DieuKien.toLocaleString("vi-VN")}đ
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border-2 ${
                                isSelected
                                  ? "bg-green-500 border-green-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <svg
                                  className="w-3 h-3 text-white mx-auto mt-0.5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-600">
                      Bạn không có khuyến mãi nào khả dụng
                    </p>
                    <button
                      onClick={() => navigate("/khuyen-mai")}
                      className="text-green-600 hover:text-green-700 font-medium mt-2"
                    >
                      Nhận khuyến mãi ngay →
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Thông tin giao hàng
                </h2>

                <div className="space-y-4">
                  <AddressInput
                    onAddressSelect={handleAddressSelect}
                    required
                  />

                  {/* THAY THẾ BẰNG COMPONENT VẬN CHUYỂN TỐC ĐỘ CAO */}
                  <ShippingSpeedSelector
                    province={address?.province || ""}
                    district={address?.district || ""}
                    items={checkoutData.selectedItems.map((item) => ({
                      MaSP: item.MaSP,
                      SL: item.SL,
                      GiaBan: item.MaSP_sanpham.GiaBan,
                    }))}
                    selectedShipping={selectedShippingMethod}
                    onShippingSelect={handleShippingSelect}
                  />

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

            {/* Tổng kết thanh toán - Cập nhật với vận chuyển động */}
            <div className="bg-white rounded-lg shadow-sm p-6 h-fit sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Tổng kết đơn hàng</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>
                    Tạm tính ({checkoutData.selectedItems.length} sản phẩm)
                  </span>
                  <span>{subtotal.toLocaleString("vi-VN")}đ</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span>
                    {selectedShippingMethod ? (
                      <>
                        {dynamicShippingFee.toLocaleString("vi-VN")}đ
                        <div className="text-xs text-green-600">
                          {selectedShippingMethod.TenPTVC}
                        </div>
                      </>
                    ) : (
                      "Chưa chọn"
                    )}
                  </span>
                </div>

                {/* Hiển thị khuyến mãi đã áp dụng */}
                {discountResult.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Khuyến mãi đã áp dụng</span>
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

              <button
                onClick={handleCheckout}
                disabled={loading || !selectedShippingMethod}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  loading || !selectedShippingMethod
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang xử lý...
                  </div>
                ) : !selectedShippingMethod ? (
                  "Vui lòng chọn phương thức vận chuyển"
                ) : (
                  `Xác nhận đặt hàng - ${discountResult.finalTotal.toLocaleString(
                    "vi-VN"
                  )}đ`
                )}
              </button>
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
