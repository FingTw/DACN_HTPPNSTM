// src/pages/CheckoutPage.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { orderService } from '@/services/orderService';
import type { ProcessCheckoutData } from '@/services/orderService';
import {AddressInput} from '@/components/AddressInput';
import { useCallback } from 'react';

interface CheckoutProduct {
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

const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [address, setAddress] = useState<Address | null>(null);
  const [calculatedShippingFee, setCalculatedShippingFee] = useState(0);
  const [finalTotalAmount, setFinalTotalAmount] = useState(0);
  
  const [formData, setFormData] = useState({
    DCNhanHang: '',
    MaPTVC: '',
    MaPTTT: '',
  });

  // Lấy dữ liệu từ CartPage
  const checkoutData = location.state as CheckoutData;

  // Tính subtotal (chỉ tiền sản phẩm, không bao gồm phí vận chuyển cũ)
  const subtotal = checkoutData.selectedItems.reduce((total, item) => {
    return total + (item.SL * (item.MaSP_sanpham?.GiaBan || 0));
  }, 0);

  // Lấy danh sách phương thức vận chuyển và thanh toán
  useEffect(() => {
    const fetchMethods = async () => {
      try {
        setMethodsLoading(true);
        
        // Lấy phương thức vận chuyển
        const shippingData = await orderService.getShippingMethods();
        if (shippingData && shippingData.length > 0) {
          setShippingMethods(shippingData);
          setFormData(prev => ({ ...prev, MaPTVC: shippingData[0].MaPTVC }));
        } else {
          // Fallback nếu API không trả về data
          setShippingMethods([
            { MaPTVC: 'VC01', TenPTVC: 'Giao hàng nhanh', PhiVanChuyen: 30000 },
            { MaPTVC: 'VC02', TenPTVC: 'Giao hàng hỏa tốc', PhiVanChuyen: 50000 },
          ]);
          setFormData(prev => ({ ...prev, MaPTVC: 'VC01' }));
        }

        // Lấy phương thức thanh toán
        const paymentData = await orderService.getPaymentMethods();
        if (paymentData && paymentData.length > 0) {
          setPaymentMethods(paymentData);
          setFormData(prev => ({ ...prev, MaPTTT: paymentData[0].MaPTTT }));
        } else {
          // Fallback nếu API không trả về data
          setPaymentMethods([
            { MaPTTT: 'TT01', TenPTTT: 'Thanh toán khi nhận hàng (COD)' },
            { MaPTTT: 'TT02', TenPTTT: 'Chuyển khoản ngân hàng' },
          ]);
          setFormData(prev => ({ ...prev, MaPTTT: 'TT01' }));
        }

      } catch (error) {
        console.error('Lỗi lấy phương thức:', error);
        // Fallback values
        setShippingMethods([
          { MaPTVC: 'VC01', TenPTVC: 'Giao hàng nhanh', PhiVanChuyen: 30000 },
          { MaPTVC: 'VC02', TenPTVC: 'Giao hàng hỏa tốc', PhiVanChuyen: 50000 },
        ]);
        setPaymentMethods([
          { MaPTTT: 'TT01', TenPTTT: 'Thanh toán khi nhận hàng (COD)' },
          { MaPTTT: 'TT02', TenPTTT: 'Chuyển khoản ngân hàng' },
        ]);
        setFormData(prev => ({ ...prev, MaPTVC: 'VC01', MaPTTT: 'TT01' }));
      } finally {
        setMethodsLoading(false);
      }
    };

    fetchMethods();
  }, []);

  // Tính phí vận chuyển dựa trên địa chỉ (cập nhật chi tiết hơn)
  const calculateShippingByProvince = (province: string): number => {
    const shippingRates: { [key: string]: number } = {
      // Các thành phố trực thuộc trung ương
      'Thành phố Hồ Chí Minh': 20000,
      'Thành phố Hà Nội': 25000,
      'Thành phố Đà Nẵng': 30000,
      'Thành phố Cần Thơ': 35000,
      'Thành phố Hải Phòng': 35000,
      
      // Các tỉnh miền Bắc
      'Bắc Giang': 30000,
      'Bắc Ninh': 30000,
      'Hải Dương': 30000,
      'Hưng Yên': 30000,
      'Vĩnh Phúc': 30000,
      'Quảng Ninh': 35000,
      
      // Các tỉnh miền Trung
      'Thừa Thiên Huế': 35000,
      'Quảng Nam': 35000,
      'Quảng Ngãi': 40000,
      'Bình Định': 40000,
      'Phú Yên': 40000,
      'Khánh Hòa': 40000,
      
      // Các tỉnh Tây Nguyên
      'Đắk Lắk': 45000,
      'Gia Lai': 45000,
      'Lâm Đồng': 45000,
      'Kon Tum': 50000,
      
      // Các tỉnh miền Nam
      'Bình Dương': 25000,
      'Đồng Nai': 30000,
      'Bà Rịa - Vũng Tàu': 35000,
      'Long An': 30000,
      'Tiền Giang': 35000,
      'Bến Tre': 35000,
      'Vĩnh Long': 40000,
      'Trà Vinh': 40000,
      'Sóc Trăng': 45000,
      'An Giang': 45000,
      'Kiên Giang': 50000,
      'Cà Mau': 50000,
    };
    
    return shippingRates[province] || 40000; // Mặc định 40,000đ
  };

  const handleAddressSelect = useCallback ((selectedAddress: Address) => {
    console.log('📍 Địa chỉ đã chọn (CheckoutPage):', selectedAddress);
    // setAddress(selectedAddress);
    
    // Cập nhật formData với địa chỉ đầy đủ
    setFormData(prev => ({ 
      ...prev, 
      DCNhanHang: selectedAddress.fullAddress 
    }));
    // Tính phí vận chuyển dựa trên tỉnh/thành phố
    const shippingFee = calculateShippingByProvince(selectedAddress.province);
    setCalculatedShippingFee(shippingFee);
    
    // Cập nhật tổng tiền cuối cùng
    const newTotal = subtotal + shippingFee;
    setFinalTotalAmount(newTotal);

    console.log('📍 Địa chỉ đã chọn:', {
      province: selectedAddress.province,
      district: selectedAddress.district,
      ward: selectedAddress.ward,
      street: selectedAddress.street,
      fullAddress: selectedAddress.fullAddress,
      shippingFee: shippingFee,
      newTotal: newTotal
    });
  }, [subtotal]);

  // Khởi tạo giá trị ban đầu
useEffect(() => {
  if (checkoutData?.selectedItems) {
    console.log('🔄 Khởi tạo giá trị checkout...');
    
    // Tính subtotal chính xác từ các sản phẩm
    const calculatedSubtotal = checkoutData.selectedItems.reduce((total, item) => {
      return total + (item.SL * (item.MaSP_sanpham?.GiaBan || 0));
    }, 0);
    
    // Sử dụng phí vận chuyển mặc định ban đầu
    const defaultShippingFee = 30000;
    setCalculatedShippingFee(defaultShippingFee);
    setFinalTotalAmount(calculatedSubtotal + defaultShippingFee);

    console.log('💰 Khởi tạo thành công:', {
      subtotal: calculatedSubtotal,
      shippingFee: defaultShippingFee,
      totalAmount: calculatedSubtotal + defaultShippingFee
    });
  }
}, [checkoutData]);

// Lấy danh sách phương thức vận chuyển và thanh toán
useEffect(() => {
  const fetchMethods = async () => {
    // Chỉ fetch methods nếu có user đăng nhập
    if (!user) {
      setMethodsLoading(false);
      return;
    }

    try {
      setMethodsLoading(true);
      console.log('🔄 Đang tải phương thức vận chuyển và thanh toán...');
      
      // Lấy phương thức vận chuyển
      const shippingData = await orderService.getShippingMethods();
      if (shippingData && shippingData.length > 0) {
        setShippingMethods(shippingData);
        setFormData(prev => ({ ...prev, MaPTVC: shippingData[0].MaPTVC }));
        console.log('✅ Phương thức vận chuyển:', shippingData);
      } else {
        // Fallback nếu API không trả về data
        const fallbackShipping = [
          { MaPTVC: 'VC01', TenPTVC: 'Giao hàng tiêu chuẩn', PhiVanChuyen: 30000 },
          { MaPTVC: 'VC02', TenPTVC: 'Giao hàng nhanh', PhiVanChuyen: 50000 },
          // { MaPTVC: 'VC03', TenPTVC: 'Giao hàng hỏa tốc', PhiVanChuyen: 80000 },
        ];
        setShippingMethods(fallbackShipping);
        setFormData(prev => ({ ...prev, MaPTVC: 'VC01' }));
        console.log('⚠️ Sử dụng phương thức vận chuyển mặc định');
      }

      // Lấy phương thức thanh toán
      const paymentData = await orderService.getPaymentMethods();
      if (paymentData && paymentData.length > 0) {
        setPaymentMethods(paymentData);
        setFormData(prev => ({ ...prev, MaPTTT: paymentData[0].MaPTTT }));
        console.log('✅ Phương thức thanh toán:', paymentData);
      } else {
        // Fallback nếu API không trả về data
        const fallbackPayment = [
          { MaPTTT: 'TT01', TenPTTT: 'Thanh toán khi nhận hàng (COD)' },
          { MaPTTT: 'TT02', TenPTTT: 'Chuyển khoản ngân hàng' },
          // { MaPTTT: 'TT03', TenPTTT: 'Ví điện tử' },
        ];
        setPaymentMethods(fallbackPayment);
        setFormData(prev => ({ ...prev, MaPTTT: 'TT01' }));
        console.log('⚠️ Sử dụng phương thức thanh toán mặc định');
      }

    } catch (error) {
      console.error('❌ Lỗi lấy phương thức:', error);
      // Fallback values
      const fallbackShipping = [
        { MaPTVC: 'VC01', TenPTVC: 'Giao hàng tiêu chuẩn', PhiVanChuyen: 30000 },
        { MaPTVC: 'VC02', TenPTVC: 'Giao hàng nhanh', PhiVanChuyen: 50000 },
      ];
      const fallbackPayment = [
        { MaPTTT: 'TT01', TenPTTT: 'Thanh toán khi nhận hàng (COD)' },
        { MaPTTT: 'TT02', TenPTTT: 'Chuyển khoản ngân hàng' },
      ];
      
      setShippingMethods(fallbackShipping);
      setPaymentMethods(fallbackPayment);
      setFormData(prev => ({ ...prev, MaPTVC: 'VC01', MaPTTT: 'TT01' }));
      
      toast.error('Không thể tải phương thức thanh toán. Sử dụng phương thức mặc định.');
    } finally {
      setMethodsLoading(false);
      console.log('✅ Hoàn tất tải phương thức');
    }
  };

  fetchMethods();
}, [user]); // Thêm dependency user

// Kiểm tra dữ liệu checkout và điều hướng
useEffect(() => {
  console.log('🔍 Kiểm tra dữ liệu checkout...');
  
  if (!checkoutData?.selectedItems || checkoutData.selectedItems.length === 0) {
    console.warn('❌ Không có sản phẩm để thanh toán');
    toast.error('Không có sản phẩm để thanh toán');
    navigate('/cart');
    return;
  }

  // Debug chi tiết dữ liệu từ Cart
  console.log('📦 Dữ liệu từ Cart:', {
    itemCount: checkoutData.selectedItems.length,
    items: checkoutData.selectedItems.map(item => ({
      MaSP: item.MaSP,
      TenSP: item.MaSP_sanpham?.TenSP,
      SL: item.SL,
      GiaBan: item.MaSP_sanpham?.GiaBan,
      TongTien: item.TongTien
    })),
    originalTotal: checkoutData.totalAmount,
    originalShipping: checkoutData.shippingFee
  });

  // Kiểm tra tính hợp lệ của dữ liệu
  const invalidItems = checkoutData.selectedItems.filter(item => 
    !item.MaSP || !item.MaSP_sanpham || !item.MaSP_sanpham.GiaBan
  );

  if (invalidItems.length > 0) {
    console.error('❌ Có sản phẩm không hợp lệ:', invalidItems);
    toast.error('Có sản phẩm không hợp lệ trong giỏ hàng');
    navigate('/cart');
    return;
  }

  console.log('✅ Dữ liệu checkout hợp lệ');
}, [checkoutData, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async () => {
  if (!formData.DCNhanHang.trim()) {
    toast.error('Vui lòng nhập địa chỉ nhận hàng');
    return;
  }

  // VALIDATION
  const validationErrors: string[] = [];
  
  checkoutData.selectedItems.forEach(item => {
    if (!item.MaSP || item.MaSP.trim() === '') {
      validationErrors.push('Mã sản phẩm không hợp lệ');
    }
    if (!item.SL || item.SL < 1 || !Number.isInteger(item.SL)) {
      validationErrors.push(`Số lượng sản phẩm ${item.MaSP || 'unknown'} không hợp lệ`);
    }
    if (!item.MaSP_sanpham) {
      validationErrors.push(`Thông tin sản phẩm ${item.MaSP} không tồn tại`);
      return;
    }
    if (!item.MaSP_sanpham.GiaBan || item.MaSP_sanpham.GiaBan <= 0) {
      validationErrors.push(`Giá sản phẩm ${item.MaSP_sanpham.TenSP || item.MaSP} không hợp lệ`);
    }
     // SỬA: KIỂM TRA SLTon KỸ HƠN
    const slTon = item.MaSP_sanpham.SLTon;
    if (slTon === undefined || slTon === null || typeof slTon !== 'number') {
      validationErrors.push(`Không thể xác định số lượng tồn của sản phẩm ${item.MaSP_sanpham.TenSP || item.MaSP}. Vui lòng thử lại.`);
      return;
    }
    // Nếu SLTon là số nhưng nhỏ hơn 0
    if (slTon < 0) {
      validationErrors.push(`Sản phẩm ${item.MaSP_sanpham.TenSP || item.MaSP} đã hết hàng`);
      return;
    }
    
    // Kiểm tra số lượng đặt so với tồn kho
    if (item.SL > slTon) {
      validationErrors.push(`Số lượng sản phẩm ${item.MaSP_sanpham.TenSP || item.MaSP} vượt quá tồn kho (còn ${slTon} sản phẩm)`);
    }
    });
  if (validationErrors.length > 0) {
    toast.error(validationErrors[0]);
    return;
  }

    setLoading(true);
  try {
    // TÍNH TOÁN LẠI TỔNG TIỀN ĐỂ ĐẢM BẢO CHÍNH XÁC
    const processedItems = checkoutData.selectedItems.map(item => {
      const soLuong = Math.max(1, Number(item.SL) || 1);
      const giaBan = Number(item.MaSP_sanpham?.GiaBan) || 0;
      
      return {
        MaSP: item.MaSP.trim(),
        SL: soLuong,
        GiaBan: giaBan
      };
    });

    // TÍNH TỔNG TIỀN TỪ ITEMS - SỬ DỤNG CÙNG CÁCH TÍNH NHƯ TRONG UI
const tongTien =
  checkoutData.selectedItems.reduce((acc, item) => {
    const gia = Number(item.MaSP_sanpham?.GiaBan) || 0;
    const sl = Number(item.SL) || 0;
    return acc + gia * sl;
  }, 0) + (checkoutData.shippingFee || 0);

    console.log('💰 Using totalAmount from checkoutData:', tongTien);
    console.log('💰 Breakdown:', {
      subtotal: subtotal,
      shippingFee: checkoutData.shippingFee,
      total: checkoutData.totalAmount
    });

  const checkoutPayload: ProcessCheckoutData = {
    DCNhanHang: formData.DCNhanHang.trim(),
    MaPTVC: formData.MaPTVC,
    MaPTTT: formData.MaPTTT,
    TongTien: tongTien, 
    items: processedItems
  };

  console.log('💰 Payload with TongTien:', checkoutPayload.TongTien);

    // VALIDATE
    const hasInvalidItems = checkoutPayload.items.some(item => 
      !item.MaSP || 
      item.SL <= 0 || 
      item.GiaBan <= 0 || 
      isNaN(item.GiaBan) ||
      isNaN(item.SL)
    );

    if (hasInvalidItems) {
      console.error('❌ Invalid items:', checkoutPayload.items);
      toast.error('Dữ liệu sản phẩm không hợp lệ');
      return;
    }

    const result = await orderService.processCheckout(checkoutPayload);
    
    console.log('✅ Backend Response:', result);
    
    if (result && result.MaDH) {
      toast.success('🎉 Đặt hàng thành công! Đang chuyển về trang chủ...');
      setTimeout(() => {
        window.location.href = '/'; // Chuyển hướng hoàn toàn
      }, 2000);
    } else {
      toast.error('Đặt hàng thất bại');
    }
    } catch (error: any) {
      console.error('❌ Checkout error:', error);
      toast.error(error.message || 'Đặt hàng thất bại');
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component với các select options được render động

  return (
  <div className="min-h-screen bg-gray-50 py-8">
    <div className="max-w-6xl mx-auto px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Thanh Toán</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Sản phẩm đã chọn</h2>
            <div className="space-y-4">
              {checkoutData.selectedItems.map((item) => (
                <div key={item.MaSP} className="flex gap-4 border-b pb-4 last:border-b-0">
                  <img
                    src={item.MaSP_sanpham.HinhAnh || '/placeholder-product.jpg'}
                    alt={item.MaSP_sanpham.TenSP}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.MaSP_sanpham.TenSP}</h3>
                    <p className="text-gray-600 text-sm">Số lượng: {item.SL}</p>
                    <p className="text-green-600 font-semibold">
                      {item.TongTien.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Thông tin giao hàng</h2>
            
            <div className="space-y-4">
              {/* CHỈ THAY THẾ PHẦN NÀY - Input địa chỉ cũ bằng AddressInput mới */}
              <AddressInput onAddressSelect={handleAddressSelect} required />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phương thức vận chuyển
                </label>
                <select
                  name="MaPTVC"
                  value={formData.MaPTVC}
                  onChange={handleInputChange}
                  disabled={methodsLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                >
                  {methodsLoading ? (
                    <option>Đang tải...</option>
                  ) : (
                    shippingMethods.map(method => (
                      <option key={method.MaPTVC} value={method.MaPTVC}>
                        {method.TenPTVC} {method.PhiVanChuyen ? `- ${method.PhiVanChuyen.toLocaleString('vi-VN')}đ` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

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
                    paymentMethods.map(method => (
                      <option key={method.MaPTTT} value={method.MaPTTT}>
                        {method.TenPTTT}
                      </option>
                    ))
                  )}
                </select>
              </div>
              {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã khuyến mãi (nếu có)
                  </label>
                  <input
                    type="text"
                    name="MaKM"
                    value={formData.MaKM}
                    onChange={handleInputChange}
                    placeholder="Nhập mã khuyến mãi"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div> */}
            </div>
          </div>       
        </div>

        {/* Tổng kết thanh toán */}
        <div className="bg-white rounded-lg shadow-sm p-6 h-fit sticky top-4">
          <h2 className="text-xl font-semibold mb-4">Tổng kết đơn hàng</h2>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính ({checkoutData.selectedItems.length} sản phẩm)</span>
              <span>{Math.round(Number(checkoutData.totalAmount || 0)).toLocaleString('vi-VN')}đ</span>
            </div>
            
            <div className="flex justify-between text-gray-600">
              <span>Phí vận chuyển</span>
              <span>{checkoutData.shippingFee.toLocaleString('vi-VN')}đ</span>
            </div>
            
            <hr className="my-2" />
            
            <div className="flex justify-between text-lg font-bold text-gray-900">
              <span>Tổng cộng</span>
              <span className="text-green-600">
               {Math.round(Number(checkoutData.totalAmount || 0)).toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang xử lý...
              </div>
            ) : (
              `Xác nhận đặt hàng - ${Math.round(Number(checkoutData.totalAmount || 0)).toLocaleString('vi-VN')}đ`
            )}
          </button>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Đảm bảo chất lượng 100%</span>
            </div>
          </div>       
        </div>
      </div>
    </div>
  </div>
);
};

export default CheckoutPage;