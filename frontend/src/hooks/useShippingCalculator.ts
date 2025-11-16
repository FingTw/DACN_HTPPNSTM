// src/hooks/useShippingCalculator.ts
import { useState, useCallback, useRef } from 'react';
import { orderService } from '@/services/orderService';
import type { 
  ShippingCalculationRequest, 
  ShippingCalculationResult,
  OrderItem 
} from '@/services/orderService';

interface UseShippingCalculatorProps {
  items: OrderItem[];
  onShippingCalculated?: (results: ShippingCalculationResult[]) => void;
}

export const useShippingCalculator = ({ items, onShippingCalculated }: UseShippingCalculatorProps) => {
  const [loading, setLoading] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingCalculationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpeed, setSelectedSpeed] = useState<'standard' | 'fast' | 'express' | 'super_express'>('standard');
  
  // Dùng useRef để tránh tính toán không cần thiết và vòng lặp
  const lastCalculationRef = useRef<{ 
    province: string; 
    district: string; 
    itemsCount: number;
    deliverySpeed: string;
    itemsHash: string;
  } | null>(null);

  // Tính tổng trọng lượng đơn hàng
  const calculateTotalWeight = useCallback((items: OrderItem[]): number => {
    return items.reduce((total, item) => {
      // Giả sử mỗi sản phẩm nặng 0.5kg, trong thực tế nên lấy từ product info
      return total + (item.SL * 0.5);
    }, 0);
  }, []);

  // Kiểm tra xem có phải khu vực đô thị không
  const isUrbanArea = useCallback((province: string, district: string): boolean => {
    const urbanProvinces = [
      'Thành phố Hồ Chí Minh', 'Thành phố Hà Nội', 'Thành phố Đà Nẵng',
      'Thành phố Cần Thơ', 'Thành phố Hải Phòng'
    ];
    
    const urbanDistricts = [
      'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 9', 'Quận 10',
      'Quận 11', 'Quận 12', 'Quận Bình Thạnh', 'Quận Gò Vấp', 'Quận Phú Nhuận', 'Quận Tân Bình', 'Quận Tân Phú',
      'Quận Bình Tân', 'Quận Thủ Đức', 'Ba Đình', 'Hoàn Kiếm', 'Hai Bà Trưng', 'Đống Đa', 'Tây Hồ', 'Cầu Giấy',
      'Thanh Xuân', 'Hoàng Mai', 'Long Biên', 'Hà Đông', 'Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn',
      'Cái Răng', 'Ninh Kiều', 'Bình Thủy', 'Ô Môn', 'Hồng Bàng', 'Ngô Quyền', 'Lê Chân', 'Hải An', 'Kiến An'
    ];
    
    return urbanProvinces.includes(province) && 
           urbanDistricts.some(d => district.includes(d));
  }, []);

  // Kiểm tra có phải giờ cao điểm không
  const isPeakHours = useCallback((): boolean => {
    const now = new Date();
    const hour = now.getHours();
    return (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19);
  }, []);

  // Tạo hash để so sánh items (tránh so sánh object trực tiếp)
  const getItemsHash = useCallback((items: OrderItem[]): string => {
    return JSON.stringify(items.map(item => ({
      MaSP: item.MaSP,
      SL: item.SL,
      GiaBan: item.GiaBan
    })).sort((a, b) => a.MaSP.localeCompare(b.MaSP)));
  }, []);

  // Tính toán phí vận chuyển - ĐÃ THÊM LOGIC CHỐNG VÒNG LẶP
  const calculateShipping = useCallback(async (
    province: string,
    district: string,
    deliverySpeed?: 'standard' | 'fast' | 'express' | 'super_express'
  ) => {
    // Kiểm tra điều kiện cần thiết
    if (!province || !district || items.length === 0) {
      console.log('⏸️ Skipping calculation - missing address or items');
      return;
    }

    const currentSpeed = deliverySpeed || selectedSpeed;
    const itemsHash = getItemsHash(items);
    const currentCalculation = { 
      province, 
      district, 
      itemsCount: items.length,
      deliverySpeed: currentSpeed,
      itemsHash
    };

    // Kiểm tra xem có cần tính toán lại không
    if (lastCalculationRef.current && 
        JSON.stringify(lastCalculationRef.current) === JSON.stringify(currentCalculation)) {
      console.log('🔁 Skipping duplicate shipping calculation', currentCalculation);
      return shippingOptions;
    }

    console.log('🚀 Calculating shipping for:', currentCalculation);
    lastCalculationRef.current = currentCalculation;

    setLoading(true);
    setError(null);

    try {
      const request: ShippingCalculationRequest = {
        province,
        district,
        items: items.map(item => ({
          MaSP: item.MaSP,
          SL: item.SL,
          GiaBan: item.GiaBan
        })),
        deliverySpeed: currentSpeed,
        totalWeight: calculateTotalWeight(items),
        isUrbanArea: isUrbanArea(province, district),
        isPeakHours: isPeakHours()
      };

      console.log('📦 Shipping calculation request:', request);

      const options = await orderService.calculateShipping(request);
      
      if (options && options.length > 0) {
        console.log('✅ Shipping options calculated:', options.length, 'options');
        setShippingOptions(options);
        
        if (onShippingCalculated) {
          onShippingCalculated(options);
        }
        
        return options;
      } else {
        console.warn('⚠️ No shipping options returned');
        setError('Không có phương thức vận chuyển khả dụng');
        return null;
      }
    } catch (err: any) {
      console.error('❌ Shipping calculation error:', err);
      
      // Hiển thị thông báo lỗi cụ thể hơn
      if (err.response?.status === 400) {
        setError('Địa chỉ không hợp lệ hoặc không thể tính phí vận chuyển');
      } else if (err.response?.status === 500) {
        setError('Lỗi hệ thống, vui lòng thử lại sau');
      } else {
        setError('Không thể tính phí vận chuyển. Vui lòng thử lại.');
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [
    items, 
    selectedSpeed, 
    calculateTotalWeight, 
    isUrbanArea, 
    isPeakHours, 
    onShippingCalculated, 
    shippingOptions,
    getItemsHash
  ]);

  // Lọc các phương thức theo tốc độ
  const getOptionsBySpeed = useCallback((speed: 'standard' | 'fast' | 'express' | 'super_express') => {
    return shippingOptions.filter(option => option.TocDo === speed && option.isAvailable);
  }, [shippingOptions]);

  // Lấy phương thức vận chuyển tốc độ cao
  const getExpressOptions = useCallback(() => {
    return shippingOptions.filter(option => 
      (option.TocDo === 'express' || option.TocDo === 'super_express') && option.isAvailable
    );
  }, [shippingOptions]);

  // Lấy phương thức vận chuyển khả dụng tốt nhất
  const getBestAvailableOption = useCallback(() => {
    const availableOptions = shippingOptions.filter(option => option.isAvailable);
    
    if (availableOptions.length === 0) return null;
    
    // Ưu tiên theo tốc độ: super_express > express > fast > standard
    const priorityOrder: ('super_express' | 'express' | 'fast' | 'standard')[] = [
      'super_express', 'express', 'fast', 'standard'
    ];
    
    for (const speed of priorityOrder) {
      const option = availableOptions.find(opt => opt.TocDo === speed);
      if (option) return option;
    }
    
    return availableOptions[0];
  }, [shippingOptions]);

  // Validate đơn hàng tốc độ cao
  const validateExpressOrder = useCallback(async (
    province: string,
    district: string,
    speed: 'express' | 'super_express'
  ) => {
    if (!province || !district || items.length === 0) {
      return { isValid: false, message: 'Thiếu thông tin địa chỉ hoặc sản phẩm' };
    }

    try {
      const validation = await orderService.validateExpressOrder({
        province,
        district,
        items,
        deliverySpeed: speed
      });
      
      return validation;
    } catch (err: any) {
      console.error('❌ Express order validation error:', err);
      return { 
        isValid: false, 
        message: 'Không thể xác thực đơn hàng tốc độ cao',
        constraints: [err.message] 
      };
    }
  }, [items]);

  // Cập nhật selected speed (thêm logic tránh cập nhật không cần thiết)
  const updateSelectedSpeed = useCallback((speed: 'standard' | 'fast' | 'express' | 'super_express') => {
    if (speed !== selectedSpeed) {
      setSelectedSpeed(speed);
    }
  }, [selectedSpeed]);

  // Reset hook
  const reset = useCallback(() => {
    setShippingOptions([]);
    setError(null);
    setSelectedSpeed('standard');
    lastCalculationRef.current = null;
  }, []);

  return {
    // State
    loading,
    shippingOptions,
    expressOptions: getExpressOptions(),
    standardOptions: getOptionsBySpeed('standard'),
    fastOptions: getOptionsBySpeed('fast'),
    error,
    selectedSpeed,
    
    // Methods
    calculateShipping,
    validateExpressOrder,
    setSelectedSpeed: updateSelectedSpeed, // Sử dụng hàm đã wrap
    getBestAvailableOption,
    getOptionsBySpeed,
    reset,
    
    // Helper data
    hasExpressOptions: getExpressOptions().length > 0,
    totalWeight: calculateTotalWeight(items),
    isCalculated: shippingOptions.length > 0,
    itemsCount: items.length
  };
};