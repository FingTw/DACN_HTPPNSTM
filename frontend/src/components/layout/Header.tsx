// src/components/Header.tsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import cartService from "@/services/cartService";
import { aiService } from "@/services/aiService";
import { toast } from "sonner";
import { Loader2, Camera, Search } from "lucide-react";

export const Header: React.FC = () => {
  const [cartCount, setCartCount] = useState(0);
  const { user, logout, loading } = useAuth();

  const [searchText, setSearchText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCartCount = async () => {
      if (user) {
        try {
          const { count } = await cartService.getCartCount();
          setCartCount(count);
        } catch (error) {
          console.error("Lỗi lấy số lượng giỏ hàng:", error);
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    fetchCartCount();
  }, [user]);

  const categories = [
    { name: "Sản Phẩm", path: "/san-pham" },
    { name: "Nông sản", path: "/category/nong-san" },
    { name: "Sữa & Trứng", path: "/category/sua-trung" },
    { name: "Đặc sản vùng miền", path: "/category/dac-san" },
    { name: "Hoa quả & Hạt", path: "/category/hoa-qua-hat" },
    { name: "Rau củ & Cây trồng", path: "/category/rau-cu" },
    { name: "Khuyến Mãi", path: "/khuyen-mai", highlight: true },
    { name: "Mua theo yêu cầu", path: "/rfq", highlight: true },
  ];

  const benefits = [
    {
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ),
      text: "100% hàng hữu cơ",
    },
    {
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
      text: "Freeship đơn từ 45k",
    },
    {
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      ),
      text: "Hoàn 200% nếu hàng giả",
    },
    {
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      text: "Giao nhanh 2h",
    },
  ];

  if (loading) {
    return (
      <header className="w-full">
        {/* Top Banner Skeleton */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-gray-100 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-2">
                <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex flex-col gap-1">
                  <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>

              <div className="flex-1 max-w-2xl mx-8">
                <div className="w-full h-12 bg-gray-200 rounded-full animate-pulse"></div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-24 h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-4 py-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <div
                  key={item}
                  className="w-20 h-6 bg-gray-200 rounded animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </header>
    );
  }

  const handleTextSearch = () => {
    if (searchText.trim()) {
      // Chuyển sang trang sản phẩm với tham số search
      navigate(`/san-pham?search=${encodeURIComponent(searchText.trim())}`);
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTextSearch();
    }
  };

  const handleImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsAnalyzing(true);
      toast.info("Đang nhận diện hình ảnh...");

      // Gọi AI Service (Sử dụng service bạn đã tạo ở bước trước)
      const data = await aiService.predictImage(file);

      if (data.success) {
        const className = data.data.class_original; // Ví dụ: "apple"
        const confidence = data.data.confidence;

        toast.success(`Đã nhận diện: ${className} (${confidence}%)`);

        // Chuyển hướng sang trang sản phẩm và lọc theo loại vừa tìm được
        navigate(`/san-pham?loaiSanPham=${className}`);
      } else {
        toast.error("Không thể nhận diện sản phẩm này");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi kết nối đến server AI");
    } finally {
      setIsAnalyzing(false);
      // Reset input để chọn lại cùng 1 file được
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <header className="w-full">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-green-700"
                >
                  {benefit.icon}
                  <span className="font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/viewshop"
                className="flex items-center gap-1 text-green-700 hover:text-green-900 font-medium transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span>Cửa hàng</span>
              </Link>

              <span className="text-green-300">|</span>

              <Link
                to="/signupshop"
                className="flex items-center gap-1 text-green-700 hover:text-green-900 font-medium transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span>Đăng ký bán hàng</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="/logo.png"
                alt="SAP Logo"
                className="h-20 w-auto group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-green-700">SAP</span>
                <span className="text-xs text-green-600">NÔNG SẢN VIỆT</span>
              </div>
            </Link>

            {/* 🟢 THANH TÌM KIẾM CHÍNH */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tìm kiếm sản phẩm nông sản tươi ngon..."
                  className="w-full px-5 py-3 pr-24 border-1 border-gray-100 rounded-full text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                />

                {/* Nút tìm bằng hình ảnh */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnalyzing}
                  className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-500 hover:text-green-600 p-2 rounded-full transition-all duration-300"
                  title="Tìm kiếm bằng hình ảnh"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                  ) : (
                    <Camera className="w-5 h-5 hover:scale-110 transition-transform" />
                  )}
                </button>

                {/* Input File Ẩn */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageSelect}
                />

                {/* Nút tìm kiếm Text */}
                <button
                  onClick={handleTextSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/location"
                className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors group"
              >
                <svg
                  className="w-5 h-5 group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Giao đến</span>
                  <span className="text-sm font-medium">Q. Hoàn Kiếm, HN</span>
                </div>
              </Link>

              <Link
                to="/cart"
                className="relative p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-full transition-all hover:scale-120 group"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              <div className="relative group transition-transform duration-500 hover:scale-130">
                <button className="flex items-center gap-2 h-10 px-3 bg-white rounded-full transition-all duration-200">
                  {user ? (
                    <>
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white">
                        {user?.TenDangNhap?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <span className="hidden md:block text-green-600 font-medium pr-2">
                        {user?.TenDangNhap || "User"}
                      </span>
                    </>
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white">
                      <svg
                        className="w-9 h-9 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}
                </button>

                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border">
                  <div className="py-2">
                    {user ? (
                      <>
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Hồ sơ cá nhân
                        </Link>
                        <Link
                          to="/orders"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Đơn hàng của tôi
                        </Link>
                        <hr className="my-1" />
                        <button
                          onClick={logout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Đăng xuất
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/signin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Đăng nhập
                        </Link>
                        <Link
                          to="/signup"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Đăng ký
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Navigation */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-1 py-3 overflow-x-auto">
            {categories.map((item, index) => (
              <React.Fragment key={index}>
                <Link
                  to={item.path}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-all rounded-lg ${
                    item.highlight
                      ? "bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 shadow-md hover:shadow-lg transform hover:scale-105 animate-pulse"
                      : "text-gray-700 hover:text-green-600 hover:bg-green-50"
                  }`}
                >
                  {item.name}
                </Link>
                {(index === 0 || index === 5) && (
                  <span className="text-gray-300 mx-1">|</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};
