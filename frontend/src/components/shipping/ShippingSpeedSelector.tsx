// src/components/shipping/ShippingSpeedSelector.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useShippingCalculator } from '@/hooks/useShippingCalculator';
import type { 
  ShippingCalculationResult, 
  OrderItem 
} from '@/services/orderService';

interface ShippingSpeedSelectorProps {
  province: string;
  district: string;
  items: OrderItem[];
  selectedShipping: ShippingCalculationResult | null;
  onShippingSelect: (shipping: ShippingCalculationResult) => void;
  className?: string;
}

export const ShippingSpeedSelector: React.FC<ShippingSpeedSelectorProps> = ({
  province,
  district,
  items,
  selectedShipping,
  onShippingSelect,
  className = ''
}) => {
  const [selectedSpeed, setSelectedSpeed] = useState<'standard' | 'fast' | 'express' | 'super_express'>('standard');
  const [showExpressWarning, setShowExpressWarning] = useState(false);
  
  // Dùng useRef để track props trước đó và tránh vòng lặp
  const prevPropsRef = useRef({ province, district, items: JSON.stringify(items) });
  const isInitialMount = useRef(true);

  const {
    loading,
    shippingOptions,
    expressOptions,
    standardOptions,
    fastOptions,
    error,
    calculateShipping,
    validateExpressOrder,
    getOptionsBySpeed,
    hasExpressOptions,
    totalWeight
  } = useShippingCalculator({
    items,
    onShippingCalculated: (results) => {
      // Tự động chọn option đầu tiên khi có kết quả
      if (results.length > 0 && !selectedShipping) {
        const bestOption = results.find(opt => opt.isAvailable) || results[0];
        onShippingSelect(bestOption);
      }
    }
  });

  // Tính toán phí vận chuyển khi địa chỉ thay đổi - ĐÃ SỬA VÒNG LẶP
  useEffect(() => {
    const currentProps = { province, district, items: JSON.stringify(items) };
    const prevProps = prevPropsRef.current;

    // Chỉ tính toán lại nếu có thay đổi thực sự
    const hasProvinceChanged = prevProps.province !== province;
    const hasDistrictChanged = prevProps.district !== district;
    const hasItemsChanged = prevProps.items !== JSON.stringify(items);

    if ((hasProvinceChanged || hasDistrictChanged || hasItemsChanged || isInitialMount.current) && 
        province && district && items.length > 0) {
      
      console.log('📍 Calculating shipping for changed address:', { 
        province, 
        district,
        hasProvinceChanged,
        hasDistrictChanged, 
        hasItemsChanged,
        isInitialMount: isInitialMount.current
      });

      calculateShipping(province, district, selectedSpeed);
      
      // Cập nhật refs
      prevPropsRef.current = currentProps;
      isInitialMount.current = false;
    }
  }, [province, district, items, calculateShipping, selectedSpeed]);

  // Xử lý chọn tốc độ - ĐÃ THÊM DEBOUNCE
  const handleSpeedSelect = async (speed: 'standard' | 'fast' | 'express' | 'super_express') => {
    // Nếu đang chọn cùng tốc độ, không làm gì
    if (speed === selectedSpeed) {
      console.log('🔁 Same speed selected, skipping...');
      return;
    }

    console.log('🎯 Selected speed:', speed);
    setSelectedSpeed(speed);
    
    // Kiểm tra đơn hàng tốc độ cao
    if (speed === 'express' || speed === 'super_express') {
      const validation = await validateExpressOrder(province, district, speed);
      if (!validation.isValid) {
        setShowExpressWarning(true);
      } else {
        setShowExpressWarning(false);
      }
    } else {
      setShowExpressWarning(false);
    }

    // Tính toán lại với tốc độ mới - CHỈ KHI CÓ ĐỊA CHỈ
    if (province && district) {
      console.log('🔄 Recalculating with new speed:', speed);
      calculateShipping(province, district, speed);
    }
  };

  // Xử lý chọn phương thức vận chuyển cụ thể
  const handleShippingMethodSelect = (shipping: ShippingCalculationResult) => {
    console.log('🚚 Selected shipping method:', shipping);
    onShippingSelect(shipping);
    setShowExpressWarning(false);
  };

  // Lấy options cho tốc độ hiện tại
  const currentSpeedOptions = getOptionsBySpeed(selectedSpeed);

  // Hiển thị thông tin tốc độ
  const getSpeedInfo = (speed: string) => {
    const info = {
      standard: { label: 'Tiêu Chuẩn', time: '2-3 ngày', color: 'gray', icon: '🐢' },
      fast: { label: 'Nhanh', time: '24 giờ', color: 'blue', icon: '🚗' },
      express: { label: 'Hỏa Tốc', time: '4-8 giờ', color: 'orange', icon: '🚀' },
      super_express: { label: 'Siêu Tốc', time: '1-2 giờ', color: 'red', icon: '⚡' }
    };
    return info[speed as keyof typeof info] || info.standard;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* TIÊU ĐỀ VÀ TRẠNG THÁI */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Phương thức vận chuyển</h3>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            Đang tính phí...
          </div>
        )}
      </div>

      {/* THÔNG TIN ĐƠN HÀNG */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex justify-between text-sm text-blue-800">
          <span>📦 Tổng trọng lượng ước tính:</span>
          <span className="font-semibold">{totalWeight.toFixed(1)} kg</span>
        </div>
        <div className="flex justify-between text-sm text-blue-800 mt-1">
          <span>📍 Khu vực giao hàng:</span>
          <span className="font-semibold">{district}, {province}</span>
        </div>
      </div>

      {/* CHỌN TỐC ĐỘ GIAO HÀNG */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {(['standard', 'fast', 'express', 'super_express'] as const).map((speed) => {
          const info = getSpeedInfo(speed);
          const isSelected = selectedSpeed === speed;
          const isAvailable = speed === 'standard' || speed === 'fast' || hasExpressOptions;
          
          return (
            <button
              key={speed}
              onClick={() => handleSpeedSelect(speed)}
              disabled={!isAvailable || loading}
              className={`
                p-3 rounded-lg border-2 text-center transition-all
                ${isSelected 
                  ? `border-${info.color}-500 bg-${info.color}-50` 
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                ${loading ? 'opacity-70 cursor-wait' : 'cursor-pointer'}
              `}
            >
              <div className="text-2xl mb-1">{info.icon}</div>
              <div className="font-semibold text-gray-900">{info.label}</div>
              <div className="text-xs text-gray-600 mt-1">{info.time}</div>
              {!isAvailable && (
                <div className="text-xs text-red-600 mt-1">Không khả dụng</div>
              )}
            </button>
          );
        })}
      </div>

      {/* CẢNH BÁO TỐC ĐỘ CAO */}
      {showExpressWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-yellow-600 text-lg">⚠️</div>
            <div>
              <h4 className="font-semibold text-yellow-800 mb-1">Lưu ý quan trọng</h4>
              <p className="text-yellow-700 text-sm">
                Dịch vụ {selectedSpeed === 'express' ? 'hỏa tốc' : 'siêu tốc'} có thể bị hạn chế trong khu vực của bạn. 
                Vui lòng kiểm tra kỹ thời gian giao hàng dự kiến.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* LỖI TÍNH PHÍ */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <span>❌</span>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* DANH SÁCH PHƯƠNG THỨC VẬN CHUYỂN */}
      {!loading && currentSpeedOptions.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Lựa chọn {getSpeedInfo(selectedSpeed).label.toLowerCase()}:</h4>
          
          {currentSpeedOptions.map((shipping) => (
            <div
              key={shipping.MaPTVC}
              onClick={() => !loading && handleShippingMethodSelect(shipping)}
              className={`
                p-4 border-2 rounded-lg transition-all
                ${selectedShipping?.MaPTVC === shipping.MaPTVC
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
                ${!shipping.isAvailable ? 'opacity-60 cursor-not-allowed' : loading ? 'cursor-wait' : 'cursor-pointer'}
              `}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-semibold text-gray-900">{shipping.TenPTVC}</h5>
                    {!shipping.isAvailable && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                        Không khả dụng
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span>⏱️ {shipping.ThoiGianGiaoHang}</span>
                    <span>📅 {shipping.estimatedDelivery}</span>
                  </div>

                  {shipping.UuDai && shipping.UuDai.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {shipping.UuDai.map((benefit, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                        >
                          ✓ {benefit}
                        </span>
                      ))}
                    </div>
                  )}

                  {shipping.constraints && shipping.constraints.length > 0 && (
                    <div className="text-xs text-red-600">
                      {shipping.constraints.map((constraint, index) => (
                        <div key={index}>• {constraint}</div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-green-600">
                    {shipping.PhiVanChuyen.toLocaleString('vi-VN')}đ
                  </div>
                  {selectedShipping?.MaPTVC === shipping.MaPTVC && (
                    <div className="text-xs text-green-600 font-medium mt-1">✓ Đã chọn</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KHÔNG CÓ PHƯƠNG THỨC KHẢ DỤNG */}
      {!loading && currentSpeedOptions.length === 0 && shippingOptions.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-600">Không có phương thức {getSpeedInfo(selectedSpeed).label.toLowerCase()} khả dụng.</p>
          <p className="text-sm text-gray-500 mt-1">Vui lòng chọn tốc độ khác.</p>
        </div>
      )}

      {/* CHƯA TÍNH ĐƯỢC PHÍ */}
      {!loading && shippingOptions.length === 0 && province && district && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-600">Chưa thể tính phí vận chuyển.</p>
          <p className="text-sm text-gray-500 mt-1">Vui lòng kiểm tra lại địa chỉ giao hàng.</p>
        </div>
      )}

      {/* CHƯA CHỌN ĐỊA CHỈ */}
      {!province || !district ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-700">📍 Vui lòng chọn địa chỉ giao hàng để tính phí vận chuyển.</p>
        </div>
      ) : null}
    </div>
  );
};