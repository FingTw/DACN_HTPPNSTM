// components/cuahang/ProductManager.tsx
import React, { useState, useEffect } from "react";
import type { Product, Store, UserData } from "./store";

interface ProductManagerProps {
  store: Store;
  isOwner: boolean;
  onProductsUpdate?: () => void;
}

interface ProductFormData {
  TenSP: string;
  MoTa: string;
  GiaBan: string;
  SLTon: string;
  DVT: string;
  TrangThai: "active" | "inactive";
  HinhAnh?: File | null;
  HinhAnhPreview?: string;
}

const ProductManager: React.FC<ProductManagerProps> = ({
  store,
  isOwner,
  onProductsUpdate,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [formData, setFormData] = useState<ProductFormData>({
    TenSP: "",
    MoTa: "",
    GiaBan: "",
    SLTon: "",
    DVT: "",
    TrangThai: "active",
    HinhAnh: null,
    HinhAnhPreview: "",
  });

  // Fetch products
  const fetchProducts = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/api/sanpham/cua-hang/${store.MaCH}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📦 ProductManager - API Response:", data);

      if (data.success) {
        let productsData: Product[] = [];

        if (data.data && data.data.products) {
          productsData = data.data.products;
        } else if (Array.isArray(data.data)) {
          productsData = data.data;
        } else if (Array.isArray(data.products)) {
          productsData = data.products;
        } else if (Array.isArray(data)) {
          productsData = data;
        }

        console.log("📦 ProductManager - Products loaded:", productsData.length);
        setProducts(Array.isArray(productsData) ? productsData : []);
      } else {
        console.warn("⚠️ ProductManager - API success false:", data.message);
        setProducts([]);
      }
    } catch (error) {
      console.error("❌ ProductManager - Lỗi khi tải sản phẩm:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (store?.MaCH) {
      fetchProducts();
    }
  }, [store?.MaCH]);

  // Handle form input change
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh (JPEG, PNG, GIF, v.v.)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 5MB');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        HinhAnh: file,
        HinhAnhPreview: URL.createObjectURL(file),
      }));
    }
  };

  // Remove selected image
  const handleRemoveImage = (): void => {
    setFormData((prev) => ({
      ...prev,
      HinhAnh: null,
      HinhAnhPreview: "",
    }));
  };

  // Upload image to server
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      const token = getAuthToken();
      
      if (!token) {
        throw new Error("Không tìm thấy token xác thực");
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('loai', 'sanpham');

      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data && result.data.url) {
        console.log('✅ Upload hình ảnh thành công:', result.data.url);
        return result.data.url;
      } else {
        throw new Error(result.message || 'Upload hình ảnh thất bại');
      }
    } catch (error) {
      console.error('❌ Lỗi upload hình ảnh:', error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  // Get auth token
  const getAuthToken = (): string | null => {
    const possibleTokenKeys = ["token", "authToken", "accessToken", "jwtToken"];
    for (const key of possibleTokenKeys) {
      const token = localStorage.getItem(key);
      if (token) return token;
    }

    const userDataString = localStorage.getItem("userData");
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        return userData.token || null;
      } catch (e) {
        console.error("Không thể parse userData");
      }
    }

    return null;
  };

  // Add new product
  const handleAddProduct = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      if (!token) {
        alert("Bạn cần đăng nhập để thêm sản phẩm");
        return;
      }

      console.log("🔄 ProductManager - Thêm sản phẩm:", formData);

      let imageUrl = '';
      
      // Upload image if exists
      if (formData.HinhAnh) {
        try {
          imageUrl = await uploadImage(formData.HinhAnh) || '';
        } catch (error) {
          alert("Lỗi khi upload hình ảnh. Vui lòng thử lại.");
          return;
        }
      }

      const productData: any = {
        ...formData,
        MaCH: store.MaCH,
        GiaBan: parseFloat(formData.GiaBan),
        SLTon: parseInt(formData.SLTon),
      };

      // Add image URL if uploaded
      if (imageUrl) {
        productData.MaHA_SanPham = imageUrl; // Hoặc field tương ứng với backend
      }

      // Remove image fields before sending
      delete productData.HinhAnh;
      delete productData.HinhAnhPreview;

      const response = await fetch(
        "http://localhost:3000/api/sanpham/tao-moi",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(productData),
        }
      );

      const data = await response.json();
      console.log("📨 ProductManager - Kết quả thêm:", data);

      if (data.success) {
        setShowForm(false);
        resetForm();
        fetchProducts();
        onProductsUpdate?.();
        alert("✅ Thêm sản phẩm thành công!");
      } else {
        alert(data.message || "Lỗi khi thêm sản phẩm");
      }
    } catch (error) {
      console.error("❌ ProductManager - Lỗi khi thêm sản phẩm:", error);
      alert("Lỗi khi thêm sản phẩm");
    }
  };

  // Update product
  const handleUpdateProduct = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const token = getAuthToken();
      if (!token) {
        alert("Bạn cần đăng nhập để cập nhật sản phẩm");
        return;
      }

      console.log("🔄 ProductManager - Cập nhật sản phẩm:", editingProduct.MaSP, formData);

      let imageUrl = '';
      
      // Upload new image if exists
      if (formData.HinhAnh) {
        try {
          imageUrl = await uploadImage(formData.HinhAnh) || '';
        } catch (error) {
          alert("Lỗi khi upload hình ảnh. Vui lòng thử lại.");
          return;
        }
      }

      const productData: any = {
        ...formData,
        GiaBan: parseFloat(formData.GiaBan),
        SLTon: parseInt(formData.SLTon),
      };

      // Add image URL if new image was uploaded
      if (imageUrl) {
        productData.MaHA_SanPham = imageUrl;
      }

      // Remove image fields before sending
      delete productData.HinhAnh;
      delete productData.HinhAnhPreview;

      const response = await fetch(
        `http://localhost:3000/api/sanpham/cap-nhat/${editingProduct.MaSP}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(productData),
        }
      );

      const data = await response.json();
      console.log("📨 ProductManager - Kết quả cập nhật:", data);

      if (data.success) {
        setEditingProduct(null);
        setShowForm(false);
        resetForm();
        fetchProducts();
        onProductsUpdate?.();
        alert("✅ Cập nhật sản phẩm thành công!");
      } else {
        alert(data.message || "Lỗi khi cập nhật sản phẩm");
      }
    } catch (error) {
      console.error("❌ ProductManager - Lỗi khi cập nhật sản phẩm:", error);
      alert("Lỗi khi cập nhật sản phẩm");
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId: string): Promise<void> => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

    try {
      const token = getAuthToken();
      if (!token) {
        alert("Bạn cần đăng nhập để xóa sản phẩm");
        return;
      }

      console.log("🔄 ProductManager - Xóa sản phẩm:", productId);

      const response = await fetch(
        `http://localhost:3000/api/sanpham/xoa/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      console.log("📨 ProductManager - Kết quả xóa:", data);

      if (data.success) {
        fetchProducts();
        onProductsUpdate?.();
        alert("✅ Xóa sản phẩm thành công!");
      } else {
        alert(data.message || "Lỗi khi xóa sản phẩm");
      }
    } catch (error) {
      console.error("❌ ProductManager - Lỗi khi xóa sản phẩm:", error);
      alert("Lỗi khi xóa sản phẩm");
    }
  };

  // Start editing product
  const startEditProduct = (product: Product): void => {
    setEditingProduct(product);
    setFormData({
      TenSP: product.TenSP || "",
      MoTa: product.MoTa || "",
      GiaBan: product.GiaBan?.toString() || "",
      SLTon: product.SLTon?.toString() || "",
      DVT: product.DVT || "",
      TrangThai: (product.TrangThai as "active" | "inactive") || "active",
      HinhAnh: null,
      HinhAnhPreview: product.MaHA_SanPham || "", // Sử dụng URL hình ảnh hiện có nếu có
    });
    setShowForm(true);
  };

  // Reset form
  const resetForm = (): void => {
    setFormData({
      TenSP: "",
      MoTa: "",
      GiaBan: "",
      SLTon: "",
      DVT: "",
      TrangThai: "active",
      HinhAnh: null,
      HinhAnhPreview: "",
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  if (!isOwner) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🚫</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Không có quyền truy cập
        </h3>
        <p className="text-gray-500">
          Chỉ chủ cửa hàng mới có quyền quản lý sản phẩm
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Quản lý sản phẩm</h2>
            <p className="text-purple-100">
              Quản lý và cập nhật danh sách sản phẩm của cửa hàng
            </p>
          </div>
          <button
            onClick={() => {
              setEditingProduct(null);
              setShowForm(true);
              setFormData({
                TenSP: "",
                MoTa: "",
                GiaBan: "",
                SLTon: "",
                DVT: "",
                TrangThai: "active",
                HinhAnh: null,
                HinhAnhPreview: "",
              });
            }}
            className="bg-white text-purple-600 hover:bg-purple-50 px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <span className="text-lg">+</span>
            Thêm sản phẩm mới
          </button>
        </div>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingProduct ? "✏️ Chỉnh sửa sản phẩm" : "➕ Thêm sản phẩm mới"}
            </h3>

            <form
              onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
            >
              <div className="space-y-4">
                {/* Hình ảnh sản phẩm */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hình ảnh sản phẩm
                  </label>
                  
                  {/* Preview image */}
                  {(formData.HinhAnhPreview || (editingProduct && editingProduct.MaHA_SanPham)) && (
                    <div className="mb-3">
                      <div className="relative inline-block">
                        <img
                          src={formData.HinhAnhPreview || editingProduct?.MaHA_SanPham}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}

                  {/* File input */}
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all duration-200">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg
                          className="w-8 h-8 mb-4 text-gray-500"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 20 16"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                          />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click để upload</span> hoặc kéo thả
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF (MAX. 5MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên sản phẩm *
                  </label>
                  <input
                    type="text"
                    name="TenSP"
                    value={formData.TenSP}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="Nhập tên sản phẩm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    name="MoTa"
                    value={formData.MoTa}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="Mô tả về sản phẩm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giá bán *
                    </label>
                    <input
                      type="number"
                      name="GiaBan"
                      value={formData.GiaBan}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số lượng *
                    </label>
                    <input
                      type="number"
                      name="SLTon"
                      value={formData.SLTon}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Đơn vị tính *
                    </label>
                    <input
                      type="text"
                      name="DVT"
                      value={formData.DVT}
                      onChange={handleInputChange}
                      required
                      placeholder="kg, gói, hộp..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trạng thái
                    </label>
                    <select
                      name="TrangThai"
                      value={formData.TrangThai}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="active">Đang bán</option>
                      <option value="inactive">Ngừng bán</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {uploadingImage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang upload...
                    </>
                  ) : editingProduct ? (
                    "💾 Cập nhật"
                  ) : (
                    "➕ Thêm sản phẩm"
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={uploadingImage}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold transition-all duration-200"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products List */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">
            Danh sách sản phẩm ({products.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          {products.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hình ảnh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tồn kho
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.MaSP} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
                        {product.MaHA_SanPham ? (
                          <img
                            src={product.MaHA_SanPham}
                            alt={product.TenSP}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-400 text-2xl">🖼️</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {product.TenSP}
                        </div>
                        {product.MoTa && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.MoTa}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.GiaBan?.toLocaleString()} VNĐ
                      </div>
                      <div className="text-sm text-gray-500">
                        / {product.DVT}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          (product.SLTon || 0) > 10
                            ? "bg-green-100 text-green-800"
                            : (product.SLTon || 0) > 0
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.SLTon || 0} {product.DVT}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.TrangThai === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.TrangThai === "active" ? "Đang bán" : "Ngừng bán"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditProduct(product)}
                          className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.MaSP)}
                          className="text-red-600 hover:text-red-900 font-medium text-sm"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📦</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Chưa có sản phẩm nào
              </h3>
              <p className="text-gray-500 mb-6">
                Hãy thêm sản phẩm đầu tiên để bắt đầu kinh doanh!
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
              >
                Thêm sản phẩm ngay
              </button>
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">Đang tải sản phẩm...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManager;