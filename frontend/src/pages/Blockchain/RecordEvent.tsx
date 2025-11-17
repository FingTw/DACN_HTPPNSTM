// frontend/src/pages/BlockChain/RecordEvent.tsx
import React, { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import { blockchainAPI, isAuthenticated, getCurrentUser } from '../../services/blockchainApi';

// --- Interfaces ---
interface User {
    TenDangNhap: string;
    VaiTro: string;
}

interface FormDataType {
    productId: string;
    eventType: string;
    description: string;
    image: File | null;
}

interface ProductHistoryItem {
    blockIndex?: number;
    hash?: string;
    nonce?: number;
    timestamp: number | string;
    status: string;
    location: string;
    actor: string;
    role: string;
    notes?: string;
    imageUrl?: string;
}

interface ResultType {
    success: boolean;
    message: string;
    data?: {
        blockIndex: number;
        blockHash: string;
        timestamp: number;
    };
}

interface ProductHistory {
    productId: string;
    history?: ProductHistoryItem[];
    error?: string;
}

const RecordEvent: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<FormDataType>({
        productId: '',
        eventType: '',
        description: '',
        image: null
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ResultType | null>(null);
    const [searchProductId, setSearchProductId] = useState('');
    const [productHistory, setProductHistory] = useState<ProductHistory | null>(null);
    const [historyLoading, setHistoryLoading] = useState(false);

    const eventTypes = [
        'Trồng cây',
        'Bón phân',
        'Tưới nước',
        'Thu hoạch',
        'Sơ chế',
        'Đóng gói',
        'Vận chuyển',
        'Nhập kho',
        'Kiểm tra chất lượng',
        'Bán ra'
    ];

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = () => {
        if (!isAuthenticated()) {
            window.location.href = '/blockchain/login';
            return;
        }

        const user = getCurrentUser();
        if (user) {
            setCurrentUser(user);
        }
    };

    const handleInputChange = (field: keyof FormDataType, value: string | File | null) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setFormData(prev => ({
            ...prev,
            image: file
        }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!currentUser) {
            alert('Vui lòng đăng nhập để ghi sự kiện');
            return;
        }

        setLoading(true);

        try {
            let imageUrl = '';
            if (formData.image) {
                const uploadResult = await blockchainAPI.uploadImage(formData.image);
                if (uploadResult.success) {
                    imageUrl = uploadResult.data.imageUrl;
                }
            }

            const transactionData = {
                productId: formData.productId,
                eventType: formData.eventType,
                location: 'Việt Nam',
                status: formData.eventType,
                notes: formData.description,
                imageUrl,
                actor: currentUser.TenDangNhap,
                role: currentUser.VaiTro,
                timestamp: new Date().getTime()
            };

            const result = await blockchainAPI.recordTransaction(transactionData);

            if (result.success) {
                setResult({
                    success: true,
                    data: result.data,
                    message: 'Sự kiện đã được ghi thành công lên blockchain!'
                });

                setFormData({
                    productId: '',
                    eventType: '',
                    description: '',
                    image: null
                });

                const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
                if (fileInput) fileInput.value = '';

                setTimeout(() => setResult(null), 3000);
            } else {
                setResult({
                    success: false,
                    message: result.message || 'Có lỗi xảy ra khi ghi sự kiện'
                });
            }
        } catch (error: any) {
            console.error('Error recording event:', error);
            setResult({
                success: false,
                message: error.message || 'Có lỗi xảy ra khi ghi sự kiện'
            });
        } finally {
            setLoading(false);
        }
    };

    const searchProductHistory = async () => {
        if (!searchProductId.trim()) {
            alert('Vui lòng nhập mã sản phẩm');
            return;
        }

        setHistoryLoading(true);

        try {
            const response = await blockchainAPI.getProductHistory(searchProductId);
            if (response.success) {
                setProductHistory({
                    productId: searchProductId,
                    history: response.data || []
                });
            } else {
                setProductHistory({
                    productId: searchProductId,
                    error: response.message || 'Có lỗi xảy ra'
                });
            }
        } catch (error: any) {
            setProductHistory({
                productId: searchProductId,
                error: error.message
            });
        } finally {
            setHistoryLoading(false);
        }
    };

    const renderProductHistory = () => {
        if (!productHistory) return null;

        if (productHistory.error) {
            return (
                <div className="alert alert-danger">
                    ❌ {productHistory.error}
                </div>
            );
        }

        if (!productHistory.history || productHistory.history.length === 0) {
            return (
                <div className="alert alert-info">
                    ℹ️ Không tìm thấy lịch sử cho sản phẩm <strong>{productHistory.productId}</strong>
                </div>
            );
        }

        return (
            <div className="mt-3">
                <h6>Lịch sử sự kiện: {productHistory.productId}</h6>
                <div className="list-group">
                    {productHistory.history.map((item, index) => (
                        <div key={index} className="list-group-item">
                            <div className="d-flex w-100 justify-content-between">
                                <h6 className="mb-1 text-primary">{item.status}</h6>
                                <small className="text-muted">
                                    {new Date(item.timestamp).toLocaleString('vi-VN')}
                                </small>
                            </div>
                            <p className="mb-1">{item.notes}</p>
                            <small className="text-muted">
                                👤 {item.actor} ({item.role}) | 📍 {item.location}
                            </small>
                            {item.imageUrl && (
                                <div className="mt-2">
                                    <img
                                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${item.imageUrl}`}
                                        alt="Minh chứng"
                                        style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '5px' }}
                                        className="border"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (!currentUser) {
        return (
            <div className="container mt-4">
                <div className="alert alert-warning text-center">
                    ⏳ Đang tải...
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    {/* Form Ghi sự kiện */}
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white">
                            <h4 className="mb-0">📝 Ghi nhận sự kiện chuỗi cung ứng</h4>
                        </div>
                        <div className="card-body">
                            <form id="recordEventForm" onSubmit={handleSubmit}>
                                {/* Product ID */}
                                <div className="mb-3">
                                    <label htmlFor="productId" className="form-label">Mã sản phẩm *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="productId"
                                        value={formData.productId}
                                        onChange={(e) => handleInputChange('productId', e.target.value)}
                                        placeholder="VD: SP001"
                                        required
                                    />
                                </div>

                                {/* Event Type */}
                                <div className="mb-3">
                                    <label htmlFor="eventType" className="form-label">Loại sự kiện *</label>
                                    <select
                                        className="form-select"
                                        id="eventType"
                                        value={formData.eventType}
                                        onChange={(e) => handleInputChange('eventType', e.target.value)}
                                        required
                                    >
                                        <option value="">-- Chọn loại sự kiện --</option>
                                        {eventTypes.map((type, index) => (
                                            <option key={index} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Description */}
                                <div className="mb-3">
                                    <label htmlFor="description" className="form-label">Mô tả chi tiết *</label>
                                    <textarea
                                        className="form-control"
                                        id="description"
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                {/* Image Upload */}
                                <div className="mb-3">
                                    <label htmlFor="imageUpload" className="form-label">Hình ảnh minh chứng</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        id="imageUpload"
                                        onChange={handleImageChange}
                                        accept="image/*"
                                    />
                                </div>

                                {/* User Info */}
                                <div className="mb-3">
                                    <label className="form-label">Thông tin người thực hiện</label>
                                    <div className="card bg-light">
                                        <div className="card-body py-2">
                                            <small>
                                                <strong>User:</strong> {currentUser.TenDangNhap} |{' '}
                                                <strong>Vai trò:</strong> {currentUser.VaiTro}
                                            </small>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="d-grid gap-2">
                                    <button type="submit" className="btn btn-success btn-lg" disabled={loading}>
                                        {loading ? '⏳ Đang ghi...' : '💾 Ký và ghi lên chuỗi'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => window.history.back()}
                                    >
                                        ← Quay lại
                                    </button>
                                </div>
                            </form>

                            {/* Result */}
                            {result && (
                                <div className={`mt-4 alert ${result.success ? 'alert-success' : 'alert-danger'}`}>
                                    <strong>{result.message}</strong>
                                    {result.success && result.data && (
                                        <div className="mt-2 small">
                                            Block #{result.data.blockIndex} | Hash:{' '}
                                            {result.data.blockHash.substring(0, 16)}... |{' '}
                                            {new Date(result.data.timestamp).toLocaleString('vi-VN')}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lịch sử sản phẩm */}
                    <div className="card mt-4 shadow">
                        <div className="card-header bg-info text-white">
                            <h5 className="mb-0">📜 Lịch sử sự kiện sản phẩm</h5>
                        </div>
                        <div className="card-body">
                            <div className="input-group mb-3">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={searchProductId}
                                    onChange={(e) => setSearchProductId(e.target.value)}
                                    placeholder="Nhập mã sản phẩm để xem lịch sử"
                                />
                                <button
                                    className="btn btn-primary"
                                    type="button"
                                    onClick={searchProductHistory}
                                    disabled={historyLoading}
                                >
                                    {historyLoading ? '⏳' : '🔍'} Tìm kiếm
                                </button>
                            </div>
                            {renderProductHistory()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecordEvent;
