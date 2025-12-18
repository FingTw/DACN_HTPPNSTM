// utils/distanceCalculator.js

/**
 * DELIVERY PRICING ENGINE
 * Xử lý tính phí giao hàng theo nghiệp vụ mới
 * KHÔNG sử dụng khoảng cách thực tế cho tính phí
 */

export class DeliveryPricingEngine {
  // ====================
  // CONSTANTS & CONFIGURATION
  // ====================
  
  static DELIVERY_TYPES = {
    STANDARD: 'standard',
    FAST: 'fast',
    EXPRESS: 'express',
    SUPER_EXPRESS: 'super_express'
  };
  
  static ZONE_TYPES = {
    INTRA_CITY: 'intra_city',      // Nội thành
    INTRA_PROVINCE: 'intra_province', // Nội tỉnh (bao gồm cả nội thành)
    INTER_PROVINCE: 'inter_province'  // Liên tỉnh
  };
  
  // Danh sách tỉnh/thành phố trực thuộc TW
  static MAJOR_CITIES = [
    'hà nội', 'hanoi', 'tp.hà nội', 'tp hà nội',
    'tp.hcm', 'hồ chí minh', 'hcm', 'sài gòn', 'tp.hồ chí minh',
    'đà nẵng', 'danang', 'tp.đà nẵng', 'tp đà nẵng',
    'hải phòng', 'haiphong', 'tp.hải phòng', 'tp hải phòng',
    'cần thơ', 'cantho', 'tp.cần thơ', 'tp cần thơ'
  ];
  
  // Các quận nội thành chính (dùng để xác định nội thành)
  static INNER_DISTRICTS = {
    'hà nội': ['ba đình', 'hoàn kiếm', 'đống đa', 'hai bà trưng', 'tây hồ', 'cầu giấy', 'thanh xuân', 'hoàng mai'],
    'tp.hcm': ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12', 'tân bình', 'tân phú', 'phú nhuận', 'bình thạnh', 'gò vấp'],
    'đà nẵng': ['hải châu', 'thanh khê', 'sơn trà', 'ngũ hành sơn', 'liên chiểu'],
    'hải phòng': ['hồng bàng', 'ngô quyền', 'lê chân', 'kiến an'],
    'cần thơ': ['ninh kiều', 'bình thủy', 'cái răng', 'ô môn']
  };
  
  // Bảng giá tham chiếu (Grab/Be/Ahamove) - đơn vị: VNĐ
  static REFERENCE_PRICES = {
    'hà nội': {
      fast: 25000,
      express: 35000,
      super_express: 50000
    },
    'tp.hcm': {
      fast: 25000,
      express: 35000,
      super_express: 50000
    },
    'đà nẵng': {
      fast: 20000,
      express: 30000,
      super_express: 45000
    },
    'hải phòng': {
      fast: 20000,
      express: 30000,
      super_express: 45000
    },
    'cần thơ': {
      fast: 15000,
      express: 25000,
      super_express: 40000
    },
    'default': {
      fast: 20000,
      express: 30000,
      super_express: 45000
    }
  };
  
  // Phí giao standard (cố định theo zone)
  static STANDARD_FEES = {
    [this.ZONE_TYPES.INTRA_CITY]: 15000,
    [this.ZONE_TYPES.INTRA_PROVINCE]: 25000,
    [this.ZONE_TYPES.INTER_PROVINCE]: 45000
  };
  
  // Phí giao fast (tăng 50% so với standard)
  static FAST_FEES = {
    [this.ZONE_TYPES.INTRA_CITY]: 22500,      // 15k * 1.5
    [this.ZONE_TYPES.INTRA_PROVINCE]: 37500,  // 25k * 1.5
    [this.ZONE_TYPES.INTER_PROVINCE]: 67500   // 45k * 1.5
  };
  
  // ====================
  // PUBLIC API
  // ====================
  
  /**
   * Tính phí giao hàng dựa trên loại đơn và vùng
   * @param {string} deliveryType - Loại đơn: standard | fast | express | super_express
   * @param {string} origin - Địa chỉ lấy hàng
   * @param {string} destination - Địa chỉ giao hàng
   * @returns {Object} Kết quả tính phí với metadata
   */
  static async calculateDeliveryFee(deliveryType, origin, destination) {
    console.log(`📦 Tính phí giao hàng: ${deliveryType}`);
    
    // 1. Phân tích vùng
    const zoneAnalysis = this._analyzeZone(origin, destination);
    
    // 2. Validate điều kiện cho từng loại đơn
    const validation = this._validateDeliveryType(deliveryType, zoneAnalysis);
    
    if (!validation.valid) {
      throw new Error(`Không thể áp dụng ${deliveryType}: ${validation.reason}`);
    }
    
    // 3. Tính phí
    const feeResult = this._calculateFee(deliveryType, zoneAnalysis);
    
    // 4. Trả kết quả đầy đủ
    return {
      deliveryFee: feeResult.fee,
      deliveryType,
      zone: zoneAnalysis.zone,
      metadata: {
        originProvince: zoneAnalysis.originProvince,
        destinationProvince: zoneAnalysis.destinationProvince,
        isIntraCity: zoneAnalysis.isIntraCity,
        isIntraProvince: zoneAnalysis.isIntraProvince,
        pricingSource: feeResult.source,
        ruleApplied: validation.ruleApplied,
        estimatedDistance: feeResult.estimatedDistance,
        administrativeScope: zoneAnalysis.isIntraCity
            ? 'INNER_CITY_ONLY'
            : 'OUT_OF_SCOPE',
        calculatedAt: new Date().toISOString()
      }
    };
  }
  
  /**
   * Kiểm tra loại giao hàng có khả dụng không
   * @param {string} origin - Địa chỉ lấy hàng
   * @param {string} destination - Địa chỉ giao hàng
   * @returns {Object} Danh sách loại giao hàng khả dụng
   */
  static async getAvailableDeliveryTypes(origin, destination) {
    const zoneAnalysis = this._analyzeZone(origin, destination);
    const availableTypes = [];
    const reasons = {};
    
    // Kiểm tra từng loại
    Object.values(this.DELIVERY_TYPES).forEach(type => {
      const validation = this._validateDeliveryType(type, zoneAnalysis);
      if (validation.valid) {
        availableTypes.push(type);
      } else {
        reasons[type] = validation.reason;
      }
    });
    
    return {
      availableTypes,
      zone: zoneAnalysis.zone,
      reasons
    };
  }
  
  // ====================
  // PRIVATE METHODS
  // ====================
  
  /**
   * Phân tích vùng giao hàng
   */
  static _analyzeZone(origin, destination) {
    const normOrigin = this._normalizeAddress(origin);
    const normDest = this._normalizeAddress(destination);
    
    const originProvince = this._extractProvince(normOrigin);
    const destProvince = this._extractProvince(normDest);
    
    // Kiểm tra cùng tỉnh
    const isSameProvince = originProvince === destProvince;
    
    if (!isSameProvince) {
      return {
        zone: this.ZONE_TYPES.INTER_PROVINCE,
        originProvince,
        destinationProvince: destProvince,
        isIntraCity: false,
        isIntraProvince: false
      };
    }
    
    // Kiểm tra nội thành
    const isIntraCity = this._isIntraCity(normOrigin, normDest, originProvince);
    
    if (isIntraCity) {
      return {
        zone: this.ZONE_TYPES.INTRA_CITY,
        originProvince,
        destinationProvince: destProvince,
        isIntraCity: true,
        isIntraProvince: true
      };
    }
    
    return {
      zone: this.ZONE_TYPES.INTRA_PROVINCE,
      originProvince,
      destinationProvince: destProvince,
      isIntraCity: false,
      isIntraProvince: true
    };
  }
  
  /**
   * Validate điều kiện áp dụng loại giao hàng
   */
  static _validateDeliveryType(deliveryType, zoneAnalysis) {
    switch (deliveryType) {
      case this.DELIVERY_TYPES.STANDARD:
        return {
          valid: true,
          ruleApplied: 'STANDARD_APPLIES_TO_ALL_ZONES'
        };
        
      case this.DELIVERY_TYPES.FAST:
        // Fast áp dụng cho tất cả các zone
        return {
          valid: true,
          ruleApplied: 'FAST_APPLIES_TO_ALL_ZONES'
        };
        
      case this.DELIVERY_TYPES.EXPRESS:
        // Express chỉ áp dụng nội thành/ nội tỉnh
        if (!zoneAnalysis.isIntraProvince) {
          return {
            valid: false,
            reason: 'Express chỉ áp dụng cho đơn nội thành / nội tỉnh',
            ruleApplied: 'EXPRESS_REQUIRES_INTRAPROVINCE'
          };
        }
        
        // Express chỉ áp dụng cho thành phố lớn
        if (!this._isMajorCity(zoneAnalysis.originProvince)) {
          return {
            valid: false,
            reason: 'Express chỉ áp dụng tại các thành phố lớn',
            ruleApplied: 'EXPRESS_REQUIRES_MAJOR_CITY'
          };
        }
        
        return {
          valid: true,
          ruleApplied: 'EXPRESS_VALID_FOR_INTRAPROVINCE_MAJOR_CITY'
        };
        
      case this.DELIVERY_TYPES.SUPER_EXPRESS:
      // 1. Phải cùng tỉnh
      if (!zoneAnalysis.isIntraProvince) {
        return {
          valid: false,
          reason: 'Super Express chỉ áp dụng cho đơn nội tỉnh',
          ruleApplied: 'SUPER_EXPRESS_REQUIRES_INTRAPROVINCE'
        };
      }

      // 2. Phải là thành phố lớn
      if (!this._isMajorCity(zoneAnalysis.originProvince)) {
        return {
          valid: false,
          reason: 'Super Express chỉ áp dụng tại thành phố lớn',
          ruleApplied: 'SUPER_EXPRESS_REQUIRES_MAJOR_CITY'
        };
      }

      // 3. Phải là nội thành (bán kính hành chính)
      if (!zoneAnalysis.isIntraCity) {
        return {
          valid: false,
          reason: 'Super Express chỉ áp dụng cho khu vực nội thành',
          ruleApplied: 'SUPER_EXPRESS_REQUIRES_INTRACITY'
        };
      }

      return {
        valid: true,
        ruleApplied: 'SUPER_EXPRESS_INTRACITY_ONLY'
      };
        
      default:
        throw new Error(`Loại giao hàng không hợp lệ: ${deliveryType}`);
    }
  }
  
  /**
   * Tính phí giao hàng
   */
  static _calculateFee(deliveryType, zoneAnalysis) {
  const estimatedDistance = zoneAnalysis.isIntraCity ? 8 : null;
    
    switch (deliveryType) {
      case this.DELIVERY_TYPES.STANDARD:
        return {
          fee: this.STANDARD_FEES[zoneAnalysis.zone],
          source: 'STANDARD_FIXED_FEE_TABLE',
          estimatedDistance
        };
        
      case this.DELIVERY_TYPES.FAST:
        return {
          fee: this.FAST_FEES[zoneAnalysis.zone],
          source: 'FAST_FIXED_FEE_TABLE',
          estimatedDistance
        };
        
      case this.DELIVERY_TYPES.EXPRESS:
        const cityKey = this._getCityKey(zoneAnalysis.originProvince);
        const expressPrice = this.REFERENCE_PRICES[cityKey]?.express || this.REFERENCE_PRICES.default.express;
        
        return {
          fee: expressPrice,
          source: `MARKET_REFERENCE_${cityKey.toUpperCase()}`,
          estimatedDistance
        };
        
      case this.DELIVERY_TYPES.SUPER_EXPRESS:
        const cityKeySuper = this._getCityKey(zoneAnalysis.originProvince);
        const superExpressPrice = this.REFERENCE_PRICES[cityKeySuper]?.super_express || this.REFERENCE_PRICES.default.super_express;
        
        return {
          fee: superExpressPrice,
          source: `MARKET_REFERENCE_${cityKeySuper.toUpperCase()}_PREMIUM`,
          estimatedDistance
        };
        
      default:
        throw new Error(`Không thể tính phí cho loại: ${deliveryType}`);
    }
  }
  
  /**
   * Ước lượng khoảng cách đơn giản (phân vùng)
   * KHÔNG dùng random, chỉ ước lượng dựa trên logic phân vùng
   */
  static _estimateSimpleDistance(zoneAnalysis) {
    // Logic ước lượng deterministic:
    // - Nội thành: 3-12km (dựa trên hash của địa chỉ)
    // - Nội tỉnh (khác huyện): 15-50km
    // - Liên tỉnh: 100-500km (không dùng random)
    
    const originHash = this._simpleStringHash(zoneAnalysis.originProvince);
    const destHash = this._simpleStringHash(zoneAnalysis.destinationProvince);
    
    if (zoneAnalysis.isIntraCity) {
      // Nội thành: khoảng cách ngắn
      const combinedHash = Math.abs(originHash + destHash);
      return 3 + (combinedHash % 10); // 3-12km
    } 
    
    if (zoneAnalysis.isIntraProvince) {
      // Nội tỉnh: khoảng cách trung bình
      const combinedHash = Math.abs(originHash * 31 + destHash);
      return 15 + (combinedHash % 36); // 15-50km
    }
    
    // Liên tỉnh: khoảng cách xa
    const combinedHash = Math.abs(originHash * 97 + destHash * 31);
    return 100 + (combinedHash % 401); // 100-500km
  }
  
  // ====================
  // HELPER METHODS
  // ====================
  
  static _normalizeAddress(address) {
    if (!address) return '';
    
    return address.toLowerCase()
      .replace(/thành phố/g, 'tp.')
      .replace(/tỉnh/g, '')
      .replace(/quận/g, 'q.')
      .replace(/huyện/g, 'h.')
      .replace(/phường/g, 'p.')
      .replace(/xã/g, 'x.')
      .replace(/\./g, '.')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  static _extractProvince(address) {
    const normalized = this._normalizeAddress(address);
    
    // Tìm tỉnh/thành phố
    for (const city of this.MAJOR_CITIES) {
      if (normalized.includes(city)) {
        return city;
      }
    }
    
    // Nếu không phải thành phố lớn, trả về phần cuối của địa chỉ (giả sử là tỉnh)
    const parts = normalized.split(' ');
    if (parts.length > 1) {
      return parts[parts.length - 1];
    }
    
    return normalized;
  }
  
  static _isMajorCity(province) {
    return this.MAJOR_CITIES.some(city => 
      city.includes(province) || province.includes(city)
    );
  }
  
  static _getCityKey(province) {
    // Ánh xạ province về key chuẩn cho bảng giá
    const mappings = {
      'hà nội': 'hà nội',
      'hanoi': 'hà nội',
      'tp.hà nội': 'hà nội',
      'tp hà nội': 'hà nội',
      
      'tp.hcm': 'tp.hcm',
      'hồ chí minh': 'tp.hcm',
      'hcm': 'tp.hcm',
      'sài gòn': 'tp.hcm',
      'tp.hồ chí minh': 'tp.hcm',
      
      'đà nẵng': 'đà nẵng',
      'danang': 'đà nẵng',
      'tp.đà nẵng': 'đà nẵng',
      
      'hải phòng': 'hải phòng',
      'haiphong': 'hải phòng',
      'tp.hải phòng': 'hải phòng',
      
      'cần thơ': 'cần thơ',
      'cantho': 'cần thơ',
      'tp.cần thơ': 'cần thơ'
    };
    
    return mappings[province] || 'default';
  }
  
  static _isIntraCity(origin, destination, province) {
    // Kiểm tra cả 2 địa chỉ có thuộc quận nội thành không
    const cityKey = this._getCityKey(province);
    const innerDistricts = this.INNER_DISTRICTS[cityKey];
    
    if (!innerDistricts) return false;
    
    const originIsInner = innerDistricts.some(district => origin.includes(district));
    const destIsInner = innerDistricts.some(district => destination.includes(district));
    
    return originIsInner && destIsInner;
  }
  
  static _simpleStringHash(str) {
    // Hash đơn giản để tạo giá trị deterministic
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

// ====================
// BACKWARD COMPATIBILITY WRAPPER
// ====================

export class DistanceCalculator {
  /**
   * Wrapper để tương thích với code cũ
   */
  static async calculateRealDistance(origin, destination) {
    console.warn('⚠️ DistanceCalculator is deprecated. Use DeliveryPricingEngine instead.');
    
    const zoneAnalysis = DeliveryPricingEngine._analyzeZone(origin, destination);
    const estimatedDistance = DeliveryPricingEngine._estimateSimpleDistance(zoneAnalysis);
    
    return {
      distance: estimatedDistance,
      duration: Math.round(estimatedDistance * 2.5),
      source: 'legacy_compatibility_wrapper',
      note: 'This is estimated distance only. Use DeliveryPricingEngine for actual delivery fees.',
      zone: zoneAnalysis.zone,
      isIntraProvince: zoneAnalysis.isIntraProvince
    };
  }
}