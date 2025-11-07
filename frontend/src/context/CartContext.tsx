// src/context/CartContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import cartService from '@/services/cartService';

export interface CartItem {
  MaGH: string;
  MaSP: string;
  SL: number;
  TongTien: number;
  MaSP_sanpham: { // ✅ đổi tên đúng với CartItem.tsx
    MaSP: string;
    TenSP: string;
    GiaBan: number;
    SLTon: number;
    HinhAnh: string;
    MoTa?: string;
  };
}

interface CartContextType {
  cartCount: number;
  cartItems: CartItem[];
  cartTotal: number;
  updateCartCount: () => Promise<void>;
  fetchCart: () => Promise<void>;
  addToCart: (MaSP: string, quantity?: number) => Promise<void>;
  removeFromCart: (MaSP: string) => Promise<void>;
  updateQuantity: (MaSP: string, quantity: number) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const { user } = useAuth();

  const fetchCart = useCallback(async () => {
  if (!user) {
    setCartItems([]);
    setCartTotal(0);
    setCartCount(0);
    return;
  }

  try {
    const response = await cartService.getCart();

    // Chuẩn hóa tên trường MaSP_sanpham
    const normalizedItems = (response.items || []).map((item: any) => ({
      ...item,
      MaSP_sanpham: item.sanpham || item.MaSP_sanpham || null,
    }));

    setCartItems(normalizedItems);

    // ✅ Tính tổng tiền từ dữ liệu (nếu backend không gửi total)
    const totalAmount = normalizedItems.reduce(
      (acc: number, item: any) =>
        acc + (item.TongTien || (item.MaSP_sanpham?.GiaBan || 0) * (item.SL || 0)),
      0
    );
    setCartTotal(totalAmount);

    // ✅ Tính tổng số lượng sản phẩm
    const count = normalizedItems.reduce((acc: number, item: any) => acc + (item.SL || 0), 0);
    setCartCount(count);

  } catch (error) {
    console.error('Lỗi lấy giỏ hàng:', error);
    setCartItems([]);
    setCartTotal(0);
    setCartCount(0);
  }
}, [user]);


  const updateCartCount = useCallback(async () => {
    if (user) {
      try {
        const { count } = await cartService.getCartCount();
        setCartCount(count);
      } catch (error) {
        console.error('Lỗi cập nhật giỏ hàng:', error);
        setCartCount(0);
      }
    } else {
      setCartCount(0);
    }
  }, [user]);

  const addToCart = useCallback(
    async (MaSP: string, quantity: number = 1) => {
      if (!user) throw new Error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      await cartService.addToCart(MaSP, quantity);
      await fetchCart();
    },
    [user, fetchCart]
  );

  const removeFromCart = useCallback(
    async (MaSP: string) => {
      if (!user) return;
      await cartService.removeFromCart(MaSP);
      await fetchCart();
    },
    [user, fetchCart]
  );

  const updateQuantity = useCallback(
    async (MaSP: string, quantity: number) => {
      if (!user) return;
      await cartService.updateQuantity(MaSP, quantity);
      await fetchCart();
    },
    [user, fetchCart]
  );

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return (
    <CartContext.Provider
      value={{
        cartCount,
        cartItems,
        cartTotal,
        updateCartCount,
        fetchCart,
        addToCart,
        removeFromCart,
        updateQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
