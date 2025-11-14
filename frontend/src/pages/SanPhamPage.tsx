// pages/SanPhamPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  Star,
  Heart,
  ShoppingCart,
  Loader2,
  AlertCircle,
  Store,
  Package,
  MapPin,
  Shield,
  Truck,
  Grid3X3,
  ArrowLeft,
  Search,
  Filter,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface SanPham {
  MaSP: string;
  TenSP: string;
  MoTa?: string;
  GiaBan: number;
  SLTon: number;
  DVT: string;
  TrangThai: string;
  DiemDG_SP: number;
  SoLuongDanhGia_SP: number;
  hinhanhs?: HinhAnh[];
  MaDM_danhmucs?: DanhMuc[];
  cuahang?: {
    MaCH: string;
    TenCH: string;
    DiemDG: number;
  };
}

interface DanhMuc {
  MaDM: string;
  TenDM: string;
  SoLuongSP?: number;
}

interface HinhAnh {
  MaHA: string;
  URL: string;
  MoTa?: string;
}

interface FilterState {
  danhMuc: string[];
  minPrice: number | "";
  maxPrice: number | "";
  minRating: number | "";
  trangThai: string[];
  tuKhoa: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

const SanPhamPage: React.FC = () => {
  const [sanPhams, setSanPhams] = useState<SanPham[]>([]);
  const [danhMucs, setDanhMucs] = useState<DanhMuc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    danhMuc: [],
    minPrice: "",
    maxPrice: "",
    minRating: "",
    trangThai: ["Đang bán"],
    tuKhoa: "",
  });
  const [sortBy, setSortBy] = useState<
    "newest" | "price_asc" | "price_desc" | "rating" | "name"
  >("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 12,
    totalItems: 0,
    totalPages: 0,
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const navigate = useNavigate();

  // 🟢 FETCH DANH SÁCH SẢN PHẨM
  const fetchSanPhams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();

      // Thêm bộ lọc vào query params
      if (filters.danhMuc.length > 0) {
        filters.danhMuc.forEach((dm) => queryParams.append("danhMuc", dm));
      }
      if (filters.minPrice)
        queryParams.append("minPrice", filters.minPrice.toString());
      if (filters.maxPrice)
        queryParams.append("maxPrice", filters.maxPrice.toString());
      if (filters.minRating)
        queryParams.append("minRating", filters.minRating.toString());
      if (filters.tuKhoa) queryParams.append("search", filters.tuKhoa);

      queryParams.append("sortBy", sortBy);
      queryParams.append("page", currentPage.toString());
      queryParams.append("limit", "12");
      queryParams.append("include", "hinhanh,danhmuc,cuahang");

      const response = await fetch(
        `http://localhost:3000/api/sanpham?${queryParams}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSanPhams(data.data.products || []);
        setPagination(
          data.data.pagination || {
            page: currentPage,
            limit: 12,
            totalItems: 0,
            totalPages: 0,
          }
        );
      } else {
        console.error("Lỗi khi tải sản phẩm:", data.message);
        setSanPhams([]);
        setError(data.message || "Không thể tải danh sách sản phẩm");
      }
    } catch (err) {
      console.error("Lỗi khi tải sản phẩm:", err);
      setError("Không thể kết nối đến server. Vui lòng thử lại sau.");
      setSanPhams([]);
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, currentPage]);

  // 🟢 FETCH DANH MỤC
  const fetchDanhMucs = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/categories?includeCount=true"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setDanhMucs(data.data.categories || []);
      } else {
        console.error("Lỗi khi tải danh mục:", data.message);
        setDanhMucs([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh mục:", error);
      setDanhMucs([]);
    }
  };

  useEffect(() => {
    fetchSanPhams();
    fetchDanhMucs();
  }, [fetchSanPhams]);

  // 🟢 CẬP NHẬT BỘ LỌC
  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  // 🟢 XỬ LÝ THAY ĐỔI BỘ LỌC
  const handleCategoryChange = (categoryId: string) => {
    const newCategories = filters.danhMuc.includes(categoryId)
      ? filters.danhMuc.filter((id) => id !== categoryId)
      : [...filters.danhMuc, categoryId];

    updateFilters({ danhMuc: newCategories });
  };

  const handlePriceChange = (type: "min" | "max", value: string) => {
    const numValue = value === "" ? "" : Number(value);
    updateFilters({
      [type === "min" ? "minPrice" : "maxPrice"]: numValue,
    });
  };

  const handleRatingChange = (rating: number) => {
    updateFilters({ minRating: rating });
  };

  const handleSearch = (searchTerm: string) => {
    updateFilters({ tuKhoa: searchTerm });
  };

  const clearAllFilters = () => {
    updateFilters({
      danhMuc: [],
      minPrice: "",
      maxPrice: "",
      minRating: "",
      tuKhoa: "",
    });
  };

  // 🟢 HÀM ĐỊNH DẠNG TIỀN
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // 🟢 HÀM VẼ SAO ĐÁNH GIÁ
  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`w-3 h-3 ${
          index < Math.floor(rating)
            ? "text-yellow-400 fill-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  // 🟢 HÀM XỬ LÝ URL HÌNH ẢNH
  const getImageUrl = (url: string | undefined): string => {
    if (!url) return "https://via.placeholder.com/400x400?text=No+Image";
    if (url.startsWith("http")) return url;
    if (url.startsWith("/uploads/")) {
      return `http://localhost:3000${url}`;
    }
    return url;
  };

  // 🟢 RENDER PHÂN TRANG
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(
      pagination.totalPages,
      startPage + maxVisiblePages - 1
    );

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => setCurrentPage(1)}
          className="px-3 py-2 rounded-lg font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="start-ellipsis" className="px-2 py-2 text-gray-500">
            ...
          </span>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-2 rounded-lg font-medium transition-colors ${
            currentPage === i
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border border-emerald-500 shadow-lg"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-emerald-300"
          }`}
        >
          {i}
        </button>
      );
    }

    if (endPage < pagination.totalPages) {
      if (endPage < pagination.totalPages - 1) {
        pages.push(
          <span key="end-ellipsis" className="px-2 py-2 text-gray-500">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={pagination.totalPages}
          onClick={() => setCurrentPage(pagination.totalPages)}
          className="px-3 py-2 rounded-lg font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          {pagination.totalPages}
        </button>
      );
    }

    const startIndex = (currentPage - 1) * pagination.limit + 1;
    const endIndex = Math.min(
      currentPage * pagination.limit,
      pagination.totalItems
    );

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
        <div className="text-sm text-gray-600">
          Hiển thị {startIndex}-{endIndex} của {pagination.totalItems} sản phẩm
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-4 py-2 rounded-lg font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>←</span>
            <span className="hidden sm:inline">Trước</span>
          </button>

          <div className="flex gap-1">{pages}</div>

          <button
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(prev + 1, pagination.totalPages)
              )
            }
            disabled={currentPage === pagination.totalPages}
            className="flex items-center gap-1 px-4 py-2 rounded-lg font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="hidden sm:inline">Sau</span>
            <span>→</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Đến trang:</span>
          <select
            value={currentPage}
            onChange={(e) => setCurrentPage(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
          >
            {[...Array(pagination.totalPages)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  // 🟢 COMPONENT LOADING
  if (loading && sanPhams.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 to-teal-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Đang tải sản phẩm...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // 🟢 COMPONENT ERROR
  if (error && sanPhams.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 to-teal-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Lỗi tải dữ liệu
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => {
                setError(null);
                fetchSanPhams();
              }}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Thử lại
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <Header />

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* 🟢 HEADER VÀ TÌM KIẾM */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Tất cả sản phẩm
                </h1>
                <p className="text-gray-600">
                  Khám phá {pagination.totalItems} sản phẩm chất lượng
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {/* TÌM KIẾM */}
                <div className="relative flex-1 lg:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={filters.tuKhoa}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                  />
                </div>

                {/* SẮP XẾP */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-w-[180px] transition-colors"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="name">Tên A-Z</option>
                  <option value="price_asc">Giá thấp đến cao</option>
                  <option value="price_desc">Giá cao đến thấp</option>
                  <option value="rating">Đánh giá cao</option>
                </select>

                {/* NÚT FILTER MOBILE */}
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="lg:hidden flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Filter className="w-5 h-5" />
                  <span>Bộ lọc</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* 🟢 SIDEBAR BỘ LỌC */}
            <div
              className={`lg:w-80 flex-shrink-0 ${
                isFilterOpen ? "block" : "hidden lg:block"
              }`}
            >
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sticky top-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Bộ lọc
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
                    >
                      Xóa tất cả
                    </button>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="lg:hidden text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* LỌC THEO DANH MỤC */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Danh mục</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {danhMucs.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        Đang tải danh mục...
                      </p>
                    ) : (
                      danhMucs.map((danhMuc) => (
                        <label
                          key={danhMuc.MaDM}
                          className="flex items-center gap-3 p-2 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors group"
                        >
                          <input
                            type="checkbox"
                            checked={filters.danhMuc.includes(danhMuc.MaDM)}
                            onChange={() => handleCategoryChange(danhMuc.MaDM)}
                            className="rounded text-emerald-500 focus:ring-emerald-500 w-4 h-4 transition-colors"
                          />
                          <span className="flex-1 text-gray-700 group-hover:text-emerald-700">
                            {danhMuc.TenDM}
                          </span>
                          {danhMuc.SoLuongSP !== undefined && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                              {danhMuc.SoLuongSP}
                            </span>
                          )}
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* LỌC THEO KHOẢNG GIÁ */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Khoảng giá</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">
                        Từ
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={filters.minPrice}
                        onChange={(e) =>
                          handlePriceChange("min", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">
                        Đến
                      </label>
                      <input
                        type="number"
                        placeholder="9999999"
                        value={filters.maxPrice}
                        onChange={(e) =>
                          handlePriceChange("max", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* LỌC THEO ĐÁNH GIÁ */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Đánh giá</h3>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <label
                        key={rating}
                        className="flex items-center gap-3 p-2 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors group"
                      >
                        <input
                          type="radio"
                          name="rating"
                          checked={filters.minRating === rating}
                          onChange={() => handleRatingChange(rating)}
                          className="text-emerald-500 focus:ring-emerald-500 transition-colors"
                        />
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="text-sm text-gray-600 ml-1 group-hover:text-emerald-700">
                            trở lên
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 🟢 DANH SÁCH SẢN PHẨM */}
            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-3xl shadow-xl border border-gray-100 p-4 animate-pulse"
                    >
                      <div className="bg-gray-200 h-48 rounded-2xl mb-4"></div>
                      <div className="bg-gray-200 h-4 rounded mb-2"></div>
                      <div className="bg-gray-200 h-4 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : sanPhams.length > 0 ? (
                <>
                  <div className="mb-4 text-sm text-gray-600">
                    Hiển thị {sanPhams.length} trong tổng số{" "}
                    {pagination.totalItems} sản phẩm
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sanPhams.map((sanPham) => (
                      <ProductCard key={sanPham.MaSP} sanPham={sanPham} />
                    ))}
                  </div>

                  {renderPagination()}
                </>
              ) : (
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 text-center">
                  <div className="w-24 h-24 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-12 h-12 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Không tìm thấy sản phẩm
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Hãy thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

// 🟢 COMPONENT CARD SẢN PHẨM
const ProductCard: React.FC<{ sanPham: SanPham }> = ({ sanPham }) => {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  // 🟢 HÀM ĐỊNH DẠNG TIỀN
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // 🟢 HÀM VẼ SAO ĐÁNH GIÁ
  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`w-3 h-3 ${
          index < Math.floor(rating)
            ? "text-yellow-400 fill-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  // 🟢 HÀM XỬ LÝ URL HÌNH ẢNH
  const getImageUrl = (url: string | undefined): string => {
    if (!url) return "https://via.placeholder.com/400x400?text=No+Image";
    if (url.startsWith("http")) return url;
    if (url.startsWith("/uploads/")) {
      return `http://localhost:3000${url}`;
    }
    return url;
  };

  const handleViewDetails = () => {
    navigate(`/product/${sanPham.MaSP}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Thêm vào giỏ hàng:", sanPham.MaSP);
    // Thêm logic giỏ hàng ở đây
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const handleStoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sanPham.cuahang) {
      navigate(`/cuahang/${sanPham.cuahang.MaCH}`);
    }
  };

  const hasImages = sanPham.hinhanhs && sanPham.hinhanhs.length > 0;
  const mainImage = hasImages
    ? getImageUrl(sanPham.hinhanhs![0].URL)
    : "https://via.placeholder.com/400x400?text=No+Image";
  const productStock = sanPham.SLTon || 0;

  return (
    <div
      onClick={handleViewDetails}
      className="bg-white rounded-3xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer"
    >
      {/* HÌNH ẢNH */}
      <div className="relative h-48 bg-gradient-to-br from-emerald-50 to-teal-50 overflow-hidden">
        <img
          src={mainImage}
          alt={sanPham.TenSP}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src =
              "https://via.placeholder.com/400x400?text=No+Image";
          }}
        />

        {/* BADGE TRẠNG THÁI */}
        <div className="absolute top-3 left-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              sanPham.TrangThai === "Đang bán"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                : "bg-red-500 text-white"
            }`}
          >
            {sanPham.TrangThai}
          </span>
        </div>

        {/* YÊU THÍCH */}
        <button
          onClick={toggleFavorite}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
            isFavorite
              ? "bg-red-500 text-white shadow-lg"
              : "bg-white/90 text-gray-600 hover:bg-red-500 hover:text-white"
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
        </button>

        {/* ĐÁNH GIÁ */}
        {sanPham.DiemDG_SP > 0 && (
          <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 backdrop-blur-sm">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="font-medium">{sanPham.DiemDG_SP.toFixed(1)}</span>
          </div>
        )}

        {/* SỐ LƯỢNG TỒN */}
        <div className="absolute bottom-3 right-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              productStock > 10
                ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg"
                : productStock > 0
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                : "bg-red-600 text-white"
            }`}
          >
            {productStock > 0
              ? `Còn ${productStock} ${sanPham.DVT}`
              : "Hết hàng"}
          </span>
        </div>
      </div>

      {/* THÔNG TIN */}
      <div className="p-4">
        {/* TÊN SẢN PHẨM */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors">
          {sanPham.TenSP}
        </h3>

        {/* MÔ TẢ NGẮN */}
        {sanPham.MoTa && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
            {sanPham.MoTa}
          </p>
        )}

        {/* DANH MỤC */}
        {sanPham.MaDM_danhmucs && sanPham.MaDM_danhmucs.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {sanPham.MaDM_danhmucs.slice(0, 2).map((dm) => (
              <span
                key={dm.MaDM}
                className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium border border-emerald-200"
              >
                {dm.TenDM}
              </span>
            ))}
            {sanPham.MaDM_danhmucs.length > 2 && (
              <span className="text-gray-500 text-xs">
                +{sanPham.MaDM_danhmucs.length - 2}
              </span>
            )}
          </div>
        )}

        {/* CỬA HÀNG */}
        {sanPham.cuahang && (
          <div className="flex items-center gap-2 mb-3">
            <Store className="w-4 h-4 text-emerald-600" />
            <button
              onClick={handleStoreClick}
              className="text-sm text-emerald-600 hover:text-emerald-800 font-medium transition-colors truncate"
            >
              {sanPham.cuahang.TenCH}
            </button>
          </div>
        )}

        {/* GIÁ VÀ HÀNH ĐỘNG */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-lg font-bold text-emerald-600">
              {formatPrice(sanPham.GiaBan)}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              {renderStars(sanPham.DiemDG_SP)}
              <span>({sanPham.SoLuongDanhGia_SP})</span>
            </div>
          </div>

          {/* NÚT THÊM GIỎ HÀNG */}
          <button
            onClick={handleAddToCart}
            disabled={productStock === 0}
            className={`p-2 rounded-xl transition-all duration-200 ${
              productStock === 0
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SanPhamPage;
