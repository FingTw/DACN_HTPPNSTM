// src/components/AddressInput.tsx
import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import { getProvinces, getDistricts, getWards } from 'vietnam-provinces';
import { useAddress } from '@/context/AddressContext';
import type { Address as SavedAddress } from '@/context/AddressContext';

interface Address {
  street: string;
  ward: string;
  district: string;
  province: string;
  fullAddress: string;
}

interface AddressInputProps {
  onAddressSelect: (address: Address) => void;
  required?: boolean;
}

export const AddressInput: React.FC<AddressInputProps> = ({ 
  onAddressSelect, 
  required = true
}) => {
  const { addresses, addAddress, removeAddress, setDefaultAddress, getDefaultAddress } = useAddress();
  
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  
  const [selectedProvince, setSelectedProvince] = useState<any>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<any>(null);
  const [selectedWard, setSelectedWard] = useState<any>(null);
  const [street, setStreet] = useState('');
  const [showSavedAddresses, setShowSavedAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(''); // THÊM STATE NÀY
  
  // Dùng useRef để track lần render đầu tiên và tránh loop
  const isFirstRender = useRef(true);
  const lastSentAddress = useRef<string>('');

  // Tự động chọn địa chỉ mặc định khi component mount (CHỈ 1 LẦN)
  useEffect(() => {
    if (isFirstRender.current) {
      const defaultAddress = getDefaultAddress();
      if (defaultAddress) {
        console.log('🔄 Auto-filling default address:', defaultAddress);
        setSelectedAddressId(defaultAddress.id); // SET ID
        fillFormFromAddress(defaultAddress);
        sendAddressToParent(defaultAddress);
      }
      isFirstRender.current = false;
    }
  }, []);

  useEffect(() => {
    setProvinces(getProvinces());
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      const districtsData = getDistricts(selectedProvince.code);
      setDistricts(districtsData);
      setSelectedDistrict(null);
      setSelectedWard(null);
      setWards([]);
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedDistrict) {
      const wardsData = getWards(selectedDistrict.code);
      setWards(wardsData);
      setSelectedWard(null);
    } else {
      setWards([]);
    }
  }, [selectedDistrict]);

  // Điền form từ địa chỉ đã lưu - ĐÃ SỬA
  const fillFormFromAddress = async (address: SavedAddress) => {
    console.log('📍 Filling form from address:', address);
    setStreet(address.street);
    setSelectedAddressId(address.id); // SET ID KHI CHỌN ĐỊA CHỈ
    
    // Tìm và set province
    const province = getProvinces().find(p => p.name === address.province);
    if (province) {
      const provinceOption = { 
        value: province.code, 
        label: province.name, 
        code: province.code, 
        name: province.name 
      };
      setSelectedProvince(provinceOption);
      
      // Đợi province set xong rồi mới tìm district
      setTimeout(() => {
        const districtsData = getDistricts(province.code);
        setDistricts(districtsData);
        
        // Tìm district
        const district = districtsData.find((d: any) => d.name === address.district);
        if (district) {
          const districtOption = {
            value: district.code,
            label: district.name,
            code: district.code,
            name: district.name
          };
          setSelectedDistrict(districtOption);
          
          // Đợi district set xong rồi mới tìm ward
          setTimeout(() => {
            const wardsData = getWards(district.code);
            setWards(wardsData);
            
            // Tìm ward
            const ward = wardsData.find((w: any) => w.name === address.ward);
            if (ward) {
              const wardOption = {
                value: ward.code,
                label: ward.name,
                code: ward.code,
                name: ward.name
              };
              setSelectedWard(wardOption);
            }
          }, 100);
        }
      }, 100);
    }
  };

  // Gửi địa chỉ về parent - CHỈ KHI ĐỊA CHỈ THAY ĐỔI THẬT SỰ
  const sendAddressToParent = (address: Address) => {
    const addressKey = JSON.stringify(address);
    
    // Chỉ gửi nếu địa chỉ khác với lần trước
    if (lastSentAddress.current !== addressKey) {
      console.log('📤 Sending NEW address to parent:', address);
      lastSentAddress.current = addressKey;
      onAddressSelect(address);
    } else {
      console.log('🔁 Skipping duplicate address send');
    }
  };

  // Gửi địa chỉ tạm thời khi form thay đổi - DÙNG debounce
  useEffect(() => {
    if (selectedProvince && selectedDistrict && selectedWard && street) {
      const fullAddress = `${street}, ${selectedWard.name}, ${selectedDistrict.name}, ${selectedProvince.name}`;
      const tempAddress = {
        street,
        ward: selectedWard.name,
        district: selectedDistrict.name,
        province: selectedProvince.name,
        fullAddress
      };
      
      // Dùng setTimeout để tránh gọi liên tục
      const timer = setTimeout(() => {
        sendAddressToParent(tempAddress);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [selectedProvince, selectedDistrict, selectedWard, street]);

  // Lưu địa chỉ mới
  const handleSaveAddress = () => {
    if (!selectedProvince || !selectedDistrict || !selectedWard || !street.trim()) {
      alert('Vui lòng điền đầy đủ thông tin địa chỉ');
      return;
    }

    console.log('💾 Saving new address...');
    const newAddress = addAddress({
      street: street.trim(),
      ward: selectedWard.name,
      district: selectedDistrict.name,
      province: selectedProvince.name,
      fullAddress: `${street.trim()}, ${selectedWard.name}, ${selectedDistrict.name}, ${selectedProvince.name}`,
      isDefault: addresses.length === 0
    });
    
    console.log('✅ Address saved:', newAddress);
    setSelectedAddressId(newAddress.id); // SET ID MỚI
    sendAddressToParent(newAddress);
    setShowSavedAddresses(false);
    
    alert('✅ Đã lưu địa chỉ thành công!');
  };

  // Chọn địa chỉ đã lưu
  const handleSelectSavedAddress = (address: SavedAddress) => {
    console.log('🎯 Selected saved address:', address);
    setSelectedAddressId(address.id); // SET ID
    fillFormFromAddress(address);
    sendAddressToParent(address);
    setShowSavedAddresses(false);
  };

  // Đặt địa chỉ mặc định
  const handleSetDefaultAddress = (addressId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('⭐ Setting default address:', addressId);
    setDefaultAddress(addressId);
    setSelectedAddressId(addressId); // UPDATE ID
    
    // Force re-render để hiển thị thay đổi
    setShowSavedAddresses(false);
    setTimeout(() => {
      setShowSavedAddresses(true);
    }, 50);
  };

  // XÓA ĐỊA CHỈ
  const handleDeleteAddress = (addressId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) {
      return;
    }
    
    console.log('🗑️ Deleting address:', addressId);
    removeAddress(addressId);
    
    // Nếu xóa địa chỉ đang chọn, reset form
    if (selectedAddressId === addressId) {
      setSelectedAddressId('');
      setSelectedProvince(null);
      setSelectedDistrict(null);
      setSelectedWard(null);
      setStreet('');
    }
    
    // Nếu không còn địa chỉ nào, hiển thị form nhập mới
    if (addresses.length <= 1) {
      setShowSavedAddresses(false);
    }
  };

  const handleCreateNewAddress = () => {
    console.log('🆕 Creating new address');
    setSelectedAddressId(''); // RESET ID
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setStreet('');
    setShowSavedAddresses(false);
  };

  // Kiểm tra xem form hiện tại có phải là địa chỉ đã lưu không
  const isCurrentFormSavedAddress = selectedAddressId && selectedAddressId !== 'temp';

  return (
    <div className="space-y-4">
      {/* DANH SÁCH ĐỊA CHỈ ĐÃ LƯU */}
      {addresses.length > 0 && showSavedAddresses && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900">Địa chỉ đã lưu ({addresses.length})</h3>
            <button
              type="button"
              onClick={() => setShowSavedAddresses(false)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Ẩn
            </button>
          </div>
          
          <div className="space-y-3 max-h-60 overflow-y-auto border rounded-lg p-4 bg-gray-50">
            {addresses.map(address => (
              <div
                key={address.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedAddressId === address.id 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onClick={() => handleSelectSavedAddress(address)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-gray-700 font-medium">{address.fullAddress}</p>
                    {address.isDefault && (
                      <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded mt-1">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {!address.isDefault && (
                      <button
                        type="button"
                        onClick={(e) => handleSetDefaultAddress(address.id, e)}
                        className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                        title="Đặt làm mặc định"
                      >
                        ⭐
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteAddress(address.id, e)}
                      className="text-xs text-red-600 hover:text-red-800 px-2 py-1 border border-red-200 rounded hover:bg-red-50 transition-colors"
                      title="Xóa địa chỉ"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={handleCreateNewAddress}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors text-center mt-4"
            >
              + Thêm địa chỉ mới
            </button>
          </div>
        </div>
      )}

      {/* HIỂN THỊ THÔNG BÁO NẾU KHÔNG CÓ ĐỊA CHỈ NÀO */}
      {addresses.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm font-medium">
            📍 Vui lòng nhập thông tin địa chỉ để tính phí vận chuyển chính xác
          </p>
        </div>
      )}

      {/* FORM NHẬP ĐỊA CHỈ MỚI */}
      {(!showSavedAddresses || addresses.length === 0) && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* --- Tỉnh / Thành phố --- */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tỉnh/Thành phố {required && '*'}
              </label>
              <Select
                options={provinces.map(p => ({ value: p.code, label: p.name, code: p.code, name: p.name }))}
                value={selectedProvince}
                onChange={(value) => {
                  setSelectedProvince(value);
                  setSelectedAddressId(''); // Reset ID khi thay đổi thủ công
                }}
                placeholder="Nhập hoặc chọn tỉnh/thành phố"
                isClearable
                classNamePrefix="react-select"
              />
            </div>

            {/* --- Quận / Huyện --- */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quận/Huyện {required && '*'}
              </label>
              <Select
                options={districts.map(d => ({ value: d.code, label: d.name, code: d.code, name: d.name }))}
                value={selectedDistrict}
                onChange={(value) => {
                  setSelectedDistrict(value);
                  setSelectedAddressId(''); // Reset ID khi thay đổi thủ công
                }}
                placeholder={selectedProvince ? "Nhập hoặc chọn quận/huyện" : "Chọn tỉnh/thành trước"}
                isDisabled={!selectedProvince}
                isClearable
                classNamePrefix="react-select"
              />
            </div>

            {/* --- Phường / Xã --- */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phường/Xã {required && '*'}
              </label>
              <Select
                options={wards.map(w => ({ value: w.code, label: w.name, code: w.code, name: w.name }))}
                value={selectedWard}
                onChange={(value) => {
                  setSelectedWard(value);
                  setSelectedAddressId(''); // Reset ID khi thay đổi thủ công
                }}
                placeholder={selectedDistrict ? "Nhập hoặc chọn phường/xã" : "Chọn quận/huyện trước"}
                isDisabled={!selectedDistrict}
                isClearable
                classNamePrefix="react-select"
              />
            </div>

            {/* --- Đường / Số nhà --- */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đường/Số nhà {required && '*'}
              </label>
              <input
                type="text"
                value={street}
                onChange={(e) => {
                  setStreet(e.target.value);
                  setSelectedAddressId(''); // Reset ID khi thay đổi thủ công
                }}
                placeholder="Nhập số nhà, tên đường..."
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Hiển thị địa chỉ hoàn chỉnh và nút lưu - CHỈ KHI KHÔNG PHẢI ĐỊA CHỈ ĐÃ LƯU */}
          {selectedProvince && selectedDistrict && selectedWard && street && !isCurrentFormSavedAddress && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">✅ Địa chỉ hoàn chỉnh</h4>
              <p className="text-green-700 font-medium mb-3">
                {street}, {selectedWard.name}, {selectedDistrict.name}, {selectedProvince.name}
              </p>
              <button
                type="button"
                onClick={handleSaveAddress}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                💾 Lưu địa chỉ này
              </button>
            </div>
          )}

          {/* HIỂN THỊ THÔNG BÁO KHI ĐÃ CHỌN ĐỊA CHỈ ĐÃ LƯU */}
          {selectedProvince && selectedDistrict && selectedWard && street && isCurrentFormSavedAddress && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">✅ Địa chỉ đã lưu</h4>
              <p className="text-blue-700 font-medium">
                {street}, {selectedWard.name}, {selectedDistrict.name}, {selectedProvince.name}
              </p>
              <p className="text-blue-600 text-sm mt-2">
                Đây là địa chỉ đã được lưu trong danh sách của bạn.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};