// frontend/src/services/blockchainApi.ts
import axios from 'axios';
import type { AxiosResponse } from 'axios';

// Types
export interface BlockchainBlock {
    index: number;
    timestamp: number;
    data: any;
    hash: string;
    previousHash: string;
    nonce?: number;
}

export interface BlockchainStats {
    totalBlocks: number;
    totalTransactions: number;
    difficulty: number;
    isValid: boolean;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
    error?: string;
}

export interface User {
    MaTK: string;
    TenDangNhap: string;
    HoTen: string;
    VaiTro: string;
    Email?: string;
    SDT?: string;
}

export interface LoginResponse {
    token: string;
    user: User;
}

export interface UserEvent {
    productId: string;
    eventType: string;
    location: string;
    timestamp: number;
    blockIndex: number;
    notes?: string;
    qrCode?: string;
    imageUrl?: string;
}

export interface TransactionData {
    productId?: string;
    batchNumber?: string;
    productName?: string;
    location: string;
    status?: string;
    quantity?: number;
    quality?: string;
    price?: number;
    action?: string;
    eventType?: string;
    notes?: string;
    fromLocation?: string;
    toLocation?: string;
    temperature?: number;
    duration?: number;
    customerType?: string;
    harvestDate?: string;
    saleDate?: string;
    seedType?: string;
    area?: number;
    yield?: number;
    waterSource?: string;
    fertilizerType?: string;
    imageUrl?: string;
    actor?: string;
    role?: string;
    timestamp?: number;
    [key: string]: any;
}

export interface ProductHistoryItem {
    productId: string;
    eventType: string;
    status: string;
    location: string;
    actor: string;
    role: string;
    timestamp: number;
    notes?: string;
    imageUrl?: string;
    blockIndex?: number;
    hash?: string;
    nonce?: number;
}

// THÊM: Interface cho QR Code responses
export interface QRCodeResponse {
    productId: string;
    qrCode: string;
    message: string;
    timestamp: string;
    blockIndex?: number;
    blockCount?: number;
    blockHash?: string;
    url?: string;
    hash?: string;
    [key: string]: any;
}

export interface BlockQRCodeResponse {
    productId: string;
    blockIndex: number;
    blockHash: string;
    qrCode: string;
    message: string;
    timestamp?: string;
}

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Thử cả 2 nơi lưu token
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Đã thêm token vào request:', config.url);
    } else {
      console.warn('⚠️ Không tìm thấy token trong localStorage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ Response success:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      console.log('🛑 401 Unauthorized - Token có vấn đề');
      
      // Không redirect ngay, chỉ thông báo
      alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      localStorage.removeItem('token');
      localStorage.removeItem('authToken'); 
      localStorage.removeItem('user');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

// Blockchain API functions
export const blockchainAPI = {
    // Authentication
    register: async (userData: {
        TenDangNhap: string;
        MatKhau: string;
        HoTen?: string;
        SDT?: string;
        Email?: string;
        VaiTro: string;
    }): Promise<ApiResponse<{ MaTK: string; TenDangNhap: string; VaiTro: string; NgayTao: string }>> => {
        const response = await apiClient.post('/blockchain/register', userData) as AxiosResponse<ApiResponse<any>>;
        return response.data;
    },

    login: async (credentials: {
        TenDangNhap: string;
        MatKhau: string;
    }): Promise<ApiResponse<LoginResponse>> => {
        const response = await apiClient.post('/blockchain/login', credentials) as AxiosResponse<ApiResponse<LoginResponse>>;
        if (response.data.success && response.data.data.token) {
            localStorage.setItem('blockchain_token', response.data.data.token);
        }
        return response.data;
    },

    logout: (): void => {
        localStorage.removeItem('blockchain_token');
    },

    // Blockchain Data
    getFullChain: async (): Promise<ApiResponse<BlockchainBlock[]>> => {
        const response = await apiClient.get('/blockchain/full-chain') as AxiosResponse<ApiResponse<BlockchainBlock[]>>;
        return response.data;
    },

    getBlockchainStats: async (): Promise<ApiResponse<BlockchainStats>> => {
        const response = await apiClient.get('/blockchain/stats') as AxiosResponse<ApiResponse<BlockchainStats>>;
        return response.data;
    },

    validateChain: async (): Promise<ApiResponse<{ isValid: boolean; message: string; stats: BlockchainStats }>> => {
        const response = await apiClient.get('/blockchain/validate') as AxiosResponse<ApiResponse<any>>;
        return response.data;
    },

    getBlockByIndex: async (index: number): Promise<ApiResponse<BlockchainBlock>> => {
        const response = await apiClient.get(`/blockchain/block/${index}`) as AxiosResponse<ApiResponse<BlockchainBlock>>;
        return response.data;
    },

    getProductHistory: async (productId: string): Promise<ApiResponse<ProductHistoryItem[]>> => {
        const response = await apiClient.get(`/blockchain/history/${productId}`) as AxiosResponse<ApiResponse<ProductHistoryItem[]>>;
        return response.data;
    },

    // User History
    getUserHistory: async (username: string): Promise<ApiResponse<UserEvent[]>> => {
        const response = await apiClient.get(`/blockchain/user-history/${username}`) as AxiosResponse<ApiResponse<UserEvent[]>>;
        return response.data;
    },

    // Transactions
    recordTransaction: async (transactionData: TransactionData): Promise<ApiResponse<{
        blockIndex: number;
        blockHash: string;
        nonce: number;
        miningTime: string;
        timestamp: number;
        qrCode?: string;
        actor: string;
        role: string;
    }>> => {
        console.log('📝 Gửi record transaction:', transactionData);
        const response = await apiClient.post('/blockchain/record', transactionData) as AxiosResponse<ApiResponse<any>>;
        console.log('✅ Record transaction response:', response.data);
        return response.data;
    },

    // QR Code - SỬA LẠI VỚI INTERFACE MỚI
    generateQRCode: async (productId: string): Promise<ApiResponse<QRCodeResponse>> => {
        try {
            console.log(`📱 Requesting QR code for: ${productId}`);
            const response = await apiClient.get(`/blockchain/qrcode/${productId}`);
            console.log('✅ QR code response received:', response.data);
            
            // XỬ LÝ RESPONSE TỪ SERVER - có thể là 2 dạng:
            let responseData;
            if (response.data.success !== undefined) {
                // Dạng 1: {success, data, message} - đúng chuẩn
                responseData = response.data;
            } else {
                // Dạng 2: {productId, qrCode, url, ...} - response trực tiếp
                responseData = {
                    success: true,
                    data: response.data,
                    message: 'QR code generated successfully'
                };
            }
            
            return responseData;
        } catch (error: any) {
            console.error('❌ Generate QR code error:', error);
            throw error.response?.data || { message: 'Lỗi tạo QR code' };
        }
    },

    // Generate QR Code for block - SỬA LẠI VỚI INTERFACE MỚI
    generateBlockQRCode: async (productId: string, blockIndex: number, blockHash?: string): Promise<ApiResponse<BlockQRCodeResponse>> => {
        try {
            const url = `/blockchain/qrcode/block/${productId}/${blockIndex}${blockHash ? `/${blockHash}` : ''}`;
            console.log(`📱 Requesting block QR code: ${url}`);
            const response = await apiClient.get(url);
            console.log('✅ Block QR code response received');
            return response.data;
        } catch (error: any) {
            console.error('❌ Generate block QR code error:', error);
            throw error.response?.data || { message: 'Lỗi tạo QR code cho block' };
        }
    },

    getSimpleQRCode: (productId: string) => apiClient.get(`/blockchain/qrcode-simple/${productId}`),

    // User Events - SỬA LẠI
    getUserEvents: async (username: string, limit: number = 10): Promise<ApiResponse<any[]>> => {
        try {
            console.log(`👤 Getting user events for: ${username}, limit: ${limit}`);
            const response = await apiClient.get('/blockchain/user-events', {
                params: { username, limit },
            });
            console.log(`✅ User events received: ${response.data.data?.length || 0} events`);
            return response.data;
        } catch (error: any) {
            console.error('Lỗi khi gọi getUserEvents:', error);
            
            // Xử lý lỗi 404 - trả về mảng rỗng thay vì lỗi
            if (error.response?.status === 404) {
                console.log('⚠️ Endpoint user-events không tồn tại, trả về mảng rỗng');
                return {
                    success: true,
                    data: [],
                    message: 'Không tìm thấy sự kiện'
                };
            }
            
            throw error.response?.data || { message: 'Lỗi không xác định' };
        }
    },

    // Image Upload - SỬA LẠI ĐỂ XỬ LÝ RESPONSE ĐÚNG
    // Image Upload - SỬA LẠI HOÀN TOÀN
uploadImage: async (imageFile: File): Promise<any> => {
    try {
        const formData = new FormData();
        formData.append('image', imageFile);
        console.log('🖼️ Uploading image:', {
            name: imageFile.name,
            size: imageFile.size,
            type: imageFile.type
        });
        
        const response = await apiClient.post('/blockchain/upload-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        
        console.log('📊 Upload API raw response:', response.data);
        
        // 🔥 FIX: Trả về trực tiếp response.data (không wrap thêm)
        // Backend trả về: { success, message, imageUrl, filename }
        // Không phải: { success, data: { imageUrl, filename }, message }
        return response.data;
        
    } catch (error: any) {
        console.error('❌ Upload error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw error;
    }
},

    // User Management
    getUsersByRole: async (role: string): Promise<ApiResponse<User[]>> => {
        const response = await apiClient.get(`/blockchain/users/${role}`) as AxiosResponse<ApiResponse<User[]>>;
        return response.data;
    },

    // Health Check
    healthCheck: async (): Promise<ApiResponse<{
        status: string;
        message: string;
        timestamp: string;
    }>> => {
        const response = await apiClient.get('/blockchain/health') as AxiosResponse<ApiResponse<any>>;
        return response.data;
    }
};

// Utility functions
export const isAuthenticated = (): boolean => {
    return !!localStorage.getItem('blockchain_token');
};

export const getCurrentUser = (): User | null => {
    const token = localStorage.getItem('blockchain_token');
    if (!token) return null;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
            MaTK: payload.MaTK,
            TenDangNhap: payload.TenDangNhap,
            HoTen: payload.HoTen,
            VaiTro: payload.VaiTro
        };
    } catch (error) {
        console.error('Error parsing user from token:', error);
        return null;
    }
};

export const hasPermission = (requiredRole: string, userRole?: string): boolean => {
    const currentUserRole = userRole || getCurrentUser()?.VaiTro;
    if (!currentUserRole) return false;

    const roleHierarchy: { [key: string]: string[] } = {
        'Admin': ['Admin', 'Farmer', 'Shipper', 'Factory', 'CuaHang', 'KhachHang'],
        'Farmer': ['Farmer'],
        'Shipper': ['Shipper'],
        'Factory': ['Factory'],
        'CuaHang': ['CuaHang'],
        'KhachHang': ['KhachHang']
    };

    return roleHierarchy[requiredRole]?.includes(currentUserRole) || false;
};

export default blockchainAPI;