// contexts/AddressContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Address {
  id: string;
  street: string;
  ward: string;
  district: string;
  province: string;
  fullAddress: string;
  isDefault?: boolean;
  createdAt: string;
}

interface AddressContextType {
  addresses: Address[];
  addAddress: (address: Omit<Address, 'id' | 'createdAt'>) => Address;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  getDefaultAddress: () => Address | null;
  updateAddress: (id: string, address: Partial<Address>) => void;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const AddressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);

  // Load addresses từ localStorage khi khởi động
  useEffect(() => {
    const saved = localStorage.getItem('userAddresses');
    if (saved) {
      try {
        const parsedAddresses = JSON.parse(saved);
        setAddresses(parsedAddresses);
      } catch (error) {
        console.error('Lỗi khi load địa chỉ:', error);
        setAddresses([]);
      }
    }
  }, []);

  // Lưu addresses vào localStorage mỗi khi thay đổi
  useEffect(() => {
    localStorage.setItem('userAddresses', JSON.stringify(addresses));
  }, [addresses]);

  const addAddress = (addressData: Omit<Address, 'id' | 'createdAt'>): Address => {
    const newAddress: Address = {
      ...addressData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    setAddresses(prev => {
      // Nếu đặt làm mặc định, bỏ mặc định của các address khác
      if (newAddress.isDefault) {
        return [newAddress, ...prev.map(addr => ({ ...addr, isDefault: false }))];
      }
      return [...prev, newAddress];
    });
    
    return newAddress;
  };

  const removeAddress = (id: string) => {
    setAddresses(prev => prev.filter(addr => addr.id !== id));
  };

  const setDefaultAddress = (id: string) => {
    setAddresses(prev => 
      prev.map(addr => ({
        ...addr,
        isDefault: addr.id === id
      })).sort((a, b) => (a.isDefault ? -1 : 1))
    );
  };

  const updateAddress = (id: string, updatedData: Partial<Address>) => {
    setAddresses(prev =>
      prev.map(addr =>
        addr.id === id ? { ...addr, ...updatedData } : addr
      )
    );
  };

  const getDefaultAddress = (): Address | null => {
    return addresses.find(addr => addr.isDefault) || addresses[0] || null;
  };

  return (
    <AddressContext.Provider value={{
      addresses,
      addAddress,
      removeAddress,
      setDefaultAddress,
      getDefaultAddress,
      updateAddress
    }}>
      {children}
    </AddressContext.Provider>
  );
};

export const useAddress = () => {
  const context = useContext(AddressContext);
  if (!context) {
    throw new Error('useAddress must be used within AddressProvider');
  }
  return context;
};