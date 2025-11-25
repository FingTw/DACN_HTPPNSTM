import api from './api';

export interface CartItem {
  MaGH: string;
  MaSP: string;
  SL: number;
  TongTien: number;
  sanpham: {
    MaSP: string;
    TenSP: string;
    GiaBan: number;
    SLTon: number;
    HinhAnh: string;
    MoTa?: string;
  };
}

export interface CartResponse {
  success: boolean;
  cart: {
    MaGH: string;
    MaTK: string;
  } | null;
  items: CartItem[];
  total: number;
}

class CartService {
  // 🛒 Lấy toàn bộ giỏ hàng
  async getCart(): Promise<CartResponse> {
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { success: true, cart: null, items: [], total: 0 };
      }
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy giỏ hàng');
    }
  }

  // 📦 Lấy thông tin sản phẩm
  async getProductInfo(MaSP: string) {
    const response = await api.get(`/products/${MaSP}`);
    return response.data;
  }
  
  // 🛒 Thêm sản phẩm vào giỏ hàng
  async addToCart(MaSP: string, quantity: number = 1): Promise<CartResponse> {
    try {
      const response = await api.post('/cart/add', { MaSP, quantity });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Lỗi khi thêm vào giỏ hàng');
    }
  }

  // 🔄 Cập nhật số lượng sản phẩm
  async updateQuantity(MaSP: string, quantity: number): Promise<CartResponse> {
    try {
      const response = await api.post('/cart/update', { MaSP, quantity });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật giỏ hàng');
    }
  }

  // ❌ Xóa sản phẩm khỏi giỏ hàng
  async removeFromCart(MaSP: string): Promise<CartResponse> {
    try {
      const response = await api.post('/cart/remove', { MaSP });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Lỗi khi xóa khỏi giỏ hàng');
    }
  }

  // 🔢 Lấy tổng số lượng sản phẩm trong giỏ
  async getCartCount(): Promise<{ count: number }> {
    try {
      const response = await api.get('/cart/count');
      return response.data;
    } catch (error: any) {
      // Nếu lỗi auth, trả về count = 0
      if (error.response?.status === 401) {
        return { count: 0 };
      }
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy số lượng giỏ hàng');
    }
  }
}

export default new CartService();