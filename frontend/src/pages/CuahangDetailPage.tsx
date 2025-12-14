// pages/CuahangDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CuahangDetail from "../components/cuahang/CuahangDetail";
import CuahangProductList from "../components/cuahang/CuahangProductList";
import CuahangEditForm from "../components/cuahang/CuahangEditForm";
import ProductManager from "../components/cuahang/ProductManager";
import OrderManager from "../components/cuahang/OrderManager";
import type { Store, Product, UserData } from "../components/cuahang/store";
import { Header } from "../components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import WalletManager from "../components/cuahang/WalletManager";

// Interface cho auth response
interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: any;
}

export default function CuahangDetailPage() {
  const { MaCH } = useParams<{ MaCH: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("products");
  const [isOwner, setIsOwner] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [refreshProducts, setRefreshProducts] = useState(0);

  // Hàm refresh token
  const refreshToken = async (): Promise<string | null> => {
    try {
      console.log("🔄 Đang refresh token...");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        console.log("❌ Không có refresh token");
        return null;
      }

      const response = await fetch("http://localhost:3000/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error(`Refresh failed: ${response.status}`);
      }

      const data: AuthResponse = await response.json();

      if (data.success && data.token) {
        console.log("✅ Refresh token thành công");
        localStorage.setItem("token", data.token);
        return data.token;
      } else {
        throw new Error(data.message || "Refresh token failed");
      }
    } catch (error) {
      console.error("❌ Lỗi refresh token:", error);
      clearAuthData();
      return null;
    }
  };

  // Hàm xóa tất cả auth data
  const clearAuthData = () => {
    const authKeys = [
      "token",
      "authToken",
      "accessToken",
      "jwtToken",
      "refreshToken",
      "userData",
      "user",
      "currentUser",
      "authData",
    ];

    authKeys.forEach((key) => localStorage.removeItem(key));
    setCurrentUser(null);
  };

  // Hàm lấy token từ localStorage với khả năng refresh
  const getAuthToken = async (): Promise<string | null> => {
    const possibleTokenKeys = ["token", "authToken", "accessToken", "jwtToken"];

    for (const key of possibleTokenKeys) {
      const token = localStorage.getItem(key);
      if (token) {
        console.log(`✅ Tìm thấy token ở key: ${key}`);

        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const expiry = payload.exp * 1000;
          const now = Date.now();

          if (expiry < now) {
            console.log("⚠️ Token đã hết hạn, thử refresh...");
            const newToken = await refreshToken();
            return newToken;
          }

          return token;
        } catch (error) {
          console.log("⚠️ Không thể decode token, sử dụng trực tiếp");
          return token;
        }
      }
    }

    const userDataKeys = ["userData", "user", "currentUser", "authData"];
    for (const key of userDataKeys) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.token) {
            console.log(`✅ Tìm thấy token trong ${key}`);
            return parsed.token;
          }
        } catch (error) {
          continue;
        }
      }
    }

    console.log("❌ Không tìm thấy token trong localStorage");
    return null;
  };

  // Hàm lấy thông tin user từ localStorage
  const getCurrentUser = (): UserData | null => {
    const possibleKeys = ["userData", "user", "currentUser", "authData"];

    for (const key of possibleKeys) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          const maTK =
            parsed.MaTK ||
            parsed.maTK ||
            parsed.id ||
            parsed.userId ||
            parsed.taiKhoanId;

          if (maTK) {
            const userData = {
              MaTK: String(maTK),
              TenDangNhap:
                parsed.TenDangNhap || parsed.username || parsed.email || "",
              Email: parsed.Email || parsed.email || "",
            };
            console.log("✅ User đã đăng nhập:", userData);
            return userData;
          }
        } catch (error) {
          console.log(`❌ Không thể parse data từ key: ${key}`, error);
          continue;
        }
      }
    }

    console.log("❌ Không tìm thấy thông tin user");
    return null;
  };

  // Kiểm tra đăng nhập khi component mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      const user = getCurrentUser();
      const token = await getAuthToken();

      setCurrentUser(user);

      if (!user || !token) {
        console.warn("⚠️ User chưa đăng nhập hoặc token không tồn tại");
      } else {
        console.log("✅ User đã xác thực:", user);
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  // Kiểm tra xem user hiện tại có phải là chủ cửa hàng không
  useEffect(() => {
    if (store && currentUser) {
      const ownerCheck = store.MaTK === currentUser.MaTK;
      setIsOwner(ownerCheck);
      console.log("🔍 Kiểm tra chủ cửa hàng:", {
        storeOwner: store.MaTK,
        currentUser: currentUser.MaTK,
        isOwner: ownerCheck,
      });
    } else {
      setIsOwner(false);
    }
  }, [store, currentUser]);

  // Fetch dữ liệu cửa hàng và sản phẩm
  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (!MaCH) {
        throw new Error("Không có mã cửa hàng");
      }

      console.log(`🔄 Đang tải thông tin cửa hàng: ${MaCH}`);

      // Fetch thông tin cửa hàng
      const storeResponse = await fetch(
        `http://localhost:3000/api/cuahang/${MaCH}?include=hinhanh,hdbanhang`
      );
      if (!storeResponse.ok) {
        throw new Error(`Lỗi HTTP! status: ${storeResponse.status}`);
      }

      const storeData = await storeResponse.json();

      if (!storeData.success) {
        throw new Error(storeData.message || "Không tìm thấy cửa hàng");
      }

      if (!storeData.data) {
        throw new Error("Dữ liệu cửa hàng không hợp lệ");
      }

      // Fetch sản phẩm
      let productsData: Product[] = [];
      try {
        const productsResponse = await fetch(
          `http://localhost:3000/api/sanpham/cua-hang/${MaCH}?include=hinhanh`
        );

        console.log("📦 Response status sản phẩm:", productsResponse.status);

        if (productsResponse.ok) {
          const productsResult = await productsResponse.json();
          console.log("📦 Kết quả API sản phẩm:", productsResult);

          if (productsResult.success) {
            if (productsResult.data && productsResult.data.products) {
              productsData = productsResult.data.products;
            } else if (Array.isArray(productsResult.data)) {
              productsData = productsResult.data;
            } else {
              productsData =
                productsResult.products || productsResult.data || [];
            }

            console.log("📦 Dữ liệu sản phẩm sau khi xử lý:", productsData);
            console.log("📦 Số lượng sản phẩm:", productsData.length);
          } else {
            console.warn(
              "⚠️ API trả về success: false",
              productsResult.message
            );
          }
        } else {
          console.warn(
            "⚠️ Không thể tải sản phẩm, status:",
            productsResponse.status
          );
        }
      } catch (productError) {
        console.error("❌ Lỗi khi tải sản phẩm:", productError);
      }

      setStore(storeData.data);
      setProducts(Array.isArray(productsData) ? productsData : []);

      console.log("✅ Tải dữ liệu cửa hàng thành công");
      console.log("🏪 Store:", storeData.data.TenCH);
      console.log("📦 Products count:", productsData.length);
    } catch (error) {
      console.error("❌ Lỗi khi tải dữ liệu:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Đã xảy ra lỗi không xác định");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [MaCH, refreshProducts]);

  // Hàm cập nhật thông tin cửa hàng
  const handleUpdateStore = async (formData: FormData) => {
    try {
      console.log("🔄 [UPDATE] Bắt đầu cập nhật cửa hàng...");

      let token = localStorage.getItem("token");

      if (!token) {
        token =
          localStorage.getItem("authToken") ||
          localStorage.getItem("accessToken") ||
          localStorage.getItem("jwtToken");
      }

      if (!token) {
        const userDataString = localStorage.getItem("userData");
        if (userDataString) {
          try {
            const userData = JSON.parse(userDataString);
            token = userData.token;
            console.log("✅ Tìm thấy token trong userData");
          } catch (e) {
            console.log("❌ Không thể parse userData");
          }
        }
      }

      if (!token) {
        console.log("❌ [UPDATE] KHÔNG TÌM THẤY TOKEN TRONG LOCALSTORAGE");
        throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.");
      }

      console.log("✅ [UPDATE] Đã có token:", token.substring(0, 30) + "...");
      console.log("📦 [UPDATE] Dữ liệu gửi:");

      const url = `http://localhost:3000/api/cuahang/chinh-sua/${MaCH}`;
      console.log("🌐 [UPDATE] Gửi request đến:", url);

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          // "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log("📨 [UPDATE] Response status:", response.status);

      const responseText = await response.text();
      console.log("📨 [UPDATE] Response text:", responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error("❌ [UPDATE] Không thể parse JSON từ response");
        throw new Error(`Lỗi server: ${responseText}`);
      }

      console.log("✅ [UPDATE] Kết quả từ server:", result);

      if (result.success) {
        setStore(result.data);
        return {
          success: true,
          message: result.message || "Cập nhật thông tin thành công",
        };
      } else {
        throw new Error(result.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("❌ [UPDATE] Lỗi khi cập nhật cửa hàng:", error);

      if (error instanceof Error) {
        if (
          error.message.includes("401") ||
          error.message.includes("chưa đăng nhập")
        ) {
          clearAuthData();
          return {
            success: false,
            message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          };
        }
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: false,
        message: "Đã xảy ra lỗi không xác định khi cập nhật",
      };
    }
  };

  // Hàm xử lý khi cần đăng nhập
  const handleRequireLogin = () => {
    if (
      window.confirm(
        "Bạn cần đăng nhập để thực hiện chức năng này. Đến trang đăng nhập?"
      )
    ) {
      navigate("/dang-nhap", {
        state: { from: `/cua-hang/${MaCH}`, tab: activeTab },
      });
    }
  };

  // Hàm đăng xuất
  const handleLogout = () => {
    if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
      clearAuthData();
      window.location.reload();
    }
  };

  // Hàm refresh danh sách sản phẩm
  const handleProductsUpdate = () => {
    setRefreshProducts((prev) => prev + 1);
  };

  // HÀM XỬ LÝ URL ẢNH
  const getImageUrl = (url?: string) => {
    console.log("🖼️ Input URL:", url);
    if (!url) return "/default-store-banner.jpg"; // Bạn có thể thay bằng ảnh mặc định khác

    // 2. Nếu URL đã là đường dẫn tuyệt đối (bắt đầu bằng http hoặc https)
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;

    // Sử dụng biến môi trường cho domain server nếu có, hoặc hardcode localhost
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

    const final = `${API_URL}${cleanUrl}`;
    console.log("✅ Final URL:", final); // <--- THÊM DÒNG NÀY
    return final;
  };

  const safeStore = store || ({} as Store);
  const safeProducts = Array.isArray(products) ? products : [];

  // Render auth status
  const renderAuthStatus = () => {
    if (isCheckingAuth) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-700">Đang kiểm tra đăng nhập...</span>
          </div>
        </div>
      );
    }

    if (!currentUser) {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-700">⚠️ Bạn chưa đăng nhập</span>
            </div>
            <button
              onClick={() => navigate("/dang-nhap")}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            >
              Đăng nhập
            </button>
          </div>
        </div>
      );
    }

    // return (
    //   <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
    //     <div className="flex items-center justify-between">
    //       <div className="flex items-center gap-2">
    //         <span className="text-green-700">
    //           ✅ Đã đăng nhập: {currentUser.TenDangNhap || currentUser.Email}
    //         </span>
    //         {isOwner && (
    //           <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
    //             👑 Chủ cửa hàng
    //           </span>
    //         )}
    //       </div>
    //       <button
    //         onClick={handleLogout}
    //         className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
    //       >
    //         Đăng xuất
    //       </button>
    //     </div>
    //   </div>
    // );
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "products":
        return (
          <div className="space-y-8">
            {/* {renderAuthStatus()} */}

            {/* Thông tin cửa hàng */}
            <CuahangDetail
              store={safeStore}
              isOwner={isOwner}
              onEdit={() => {
                if (!currentUser) {
                  handleRequireLogin();
                  return;
                }
                setActiveTab("edit");
              }}
            />
            {/* Danh sách sản phẩm */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-8 py-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
                      {isOwner ? "📦 Sản phẩm của bạn" : "🛒 Sản phẩm nông sản"}
                    </h2>
                    <p className="text-gray-600">
                      {safeProducts.length > 0
                        ? `${safeProducts.length} sản phẩm có sẵn`
                        : "Chưa có sản phẩm nào"}
                    </p>
                  </div>

                  {isOwner && (
                    <div className="mt-4 sm:mt-0">
                      <button
                        onClick={() => {
                          if (!currentUser) {
                            handleRequireLogin();
                            return;
                          }
                          setActiveTab("manage");
                        }}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                      >
                        <span className="text-lg">+</span>
                        Thêm sản phẩm
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8">
                <CuahangProductList products={safeProducts} />

                {safeProducts.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">🌾</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      {isOwner ? "Chưa có sản phẩm nào" : "Chưa có sản phẩm"}
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      {isOwner
                        ? "Hãy thêm sản phẩm đầu tiên để bắt đầu kinh doanh!"
                        : `${safeStore.TenCH} đang chuẩn bị những sản phẩm tốt nhất.`}
                    </p>

                    {isOwner && (
                      <button
                        onClick={() => {
                          if (!currentUser) {
                            handleRequireLogin();
                            return;
                          }
                          setActiveTab("manage");
                        }}
                        className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                      >
                        Thêm sản phẩm ngay
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "manage":
        if (!isOwner) {
          return (
            <div className="space-y-8">
              {renderAuthStatus()}

              <div className="text-center py-12">
                <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🚫</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {!currentUser
                    ? "Vui lòng đăng nhập"
                    : "Không có quyền truy cập"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {!currentUser
                    ? "Bạn cần đăng nhập để quản lý sản phẩm"
                    : "Chỉ chủ cửa hàng mới có quyền quản lý sản phẩm."}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {!currentUser && (
                    <button
                      onClick={() => navigate("/dang-nhap")}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                    >
                      Đăng nhập
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab("products")}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                  >
                    Quay lại trang sản phẩm
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-8">
            {renderAuthStatus()}

            {store && (
              <ProductManager
                store={store}
                isOwner={isOwner}
                onProductsUpdate={handleProductsUpdate}
              />
            )}
          </div>
        );

      case "orders":
        if (!isOwner) {
          return (
            <div className="space-y-8">
              {renderAuthStatus()}
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🚫</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {!currentUser
                    ? "Vui lòng đăng nhập"
                    : "Không có quyền truy cập"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {!currentUser
                    ? "Bạn cần đăng nhập để quản lý đơn hàng"
                    : "Chỉ chủ cửa hàng mới có quyền quản lý đơn hàng."}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {!currentUser && (
                    <button
                      onClick={() => navigate("/dang-nhap")}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                    >
                      Đăng nhập
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab("products")}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                  >
                    Quay lại trang sản phẩm
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-8">
            {renderAuthStatus()}

            {/* Header trang quản lý đơn hàng */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-3xl p-8 shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📦</span>
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                  Quản lý đơn hàng
                </h2>
                <p className="text-purple-100 opacity-90">
                  Theo dõi và quản lý tất cả đơn hàng của cửa hàng
                </p>
              </div>
            </div>

            {/* Component OrderManager */}
            {store && (
              <OrderManager
                store={store}
                isOwner={isOwner}
                onOrdersUpdate={() => {
                  // Có thể thêm logic refresh nếu cần
                  console.log("Đơn hàng đã được cập nhật");
                }}
              />
            )}
          </div>
        );

      case "edit":
        if (!isOwner) {
          return (
            <div className="space-y-8">
              {renderAuthStatus()}

              <div className="text-center py-12">
                <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🚫</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {!currentUser
                    ? "Vui lòng đăng nhập"
                    : "Không có quyền truy cập"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {!currentUser
                    ? "Bạn cần đăng nhập để chỉnh sửa thông tin cửa hàng"
                    : "Chỉ chủ cửa hàng mới có quyền chỉnh sửa thông tin."}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {!currentUser && (
                    <button
                      onClick={() => navigate("/dang-nhap")}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                    >
                      Đăng nhập
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab("products")}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                  >
                    Quay lại trang sản phẩm
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-8">
            {renderAuthStatus()}

            {/* Header trang chỉnh sửa */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-3xl p-8 shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✏️</span>
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                  Chỉnh sửa thông tin cửa hàng
                </h2>
                <p className="text-blue-100 opacity-90">
                  Cập nhật thông tin cửa hàng của bạn
                </p>
              </div>
            </div>

            {/* Form chỉnh sửa */}
            <CuahangEditForm
              store={safeStore}
              onUpdate={handleUpdateStore}
              onCancel={() => setActiveTab("products")}
            />
          </div>
        );

      case "about":
        return (
          <div className="space-y-8">
            {renderAuthStatus()}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Giới thiệu cửa hàng
              </h2>
              <p className="text-gray-600">
                {safeStore.MoTa || "Cửa hàng chưa có thông tin giới thiệu."}
              </p>
            </div>
          </div>
        );

      case "reviews":
        return (
          <div className="space-y-8">
            {renderAuthStatus()}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Đánh giá cửa hàng
              </h2>
              <p className="text-gray-600">
                Tính năng đánh giá đang được phát triển...
              </p>
            </div>
          </div>
        );
      case "wallet":
        if (!isOwner) return renderAuthStatus(); // Hoặc redirect

        return (
          <div className="space-y-8">
            {renderAuthStatus()}

            {/* Header Ví tiền */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-8 shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                  Quản lý tài chính
                </h2>
                <p className="text-emerald-100 opacity-90">
                  Theo dõi số dư, doanh thu và yêu cầu rút tiền
                </p>
              </div>
            </div>

            {/* Component WalletManager */}
            {store && <WalletManager storeId={store.MaCH} />}
          </div>
        );
      default:
        return (
          <div className="space-y-8">
            {renderAuthStatus()}
            <CuahangDetail store={safeStore} isOwner={isOwner} />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải thông tin cửa hàng...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h3 className="text-xl font-bold text-red-800 mb-2">
              Đã xảy ra lỗi
            </h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => fetchData()}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />
      <div className="pt-20">
        {/* Hero Banner */}
        <div className="relative h-64 md:h-80 lg:h-96 bg-gray-900 overflow-hidden text-white">
          {/* 1. ẢNH NỀN: Sử dụng hàm getImageUrl có sẵn để xử lý link */}
          <img
            src={getImageUrl(safeStore.MaHA_CuaHang_hinhanh?.URL)}
            alt={safeStore.TenCH}
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            onError={(e) => {
              // Fallback: Nếu ảnh lỗi thì ẩn đi và hiện màu nền xanh
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              target.parentElement!.style.background =
                "linear-gradient(to right, #10b981, #14b8a6)";
            }}
          />

          {/* 2. Lớp phủ đen mờ để chữ dễ đọc hơn */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

          {/* 3. Nội dung chính (Giữ nguyên logic cũ nhưng căn chỉnh lại) */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative h-full flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-base mb-6 border border-white/30 shadow-lg">
                <span className="w-3 h-3 bg-lime-400 rounded-full mr-3 animate-pulse"></span>
                {isOwner
                  ? "🎯 QUẢN LÝ CỬA HÀNG"
                  : "✅ Cửa hàng nông sản uy tín"}
              </div>

              <h1 className="text-4xl lg:text-6xl font-bold mb-4 leading-tight drop-shadow-md">
                {safeStore.TenCH}
              </h1>

              <p className="text-emerald-50 text-xl max-w-2xl mx-auto leading-relaxed font-light drop-shadow-sm">
                {isOwner
                  ? "Chào mừng bạn trở lại! Quản lý cửa hàng thật dễ dàng"
                  : safeStore.MoTa
                  ? safeStore.MoTa.substring(0, 100) + "..."
                  : "Chuyên cung cấp nông sản sạch, an toàn và chất lượng cao"}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab("products")}
                className={`px-4 py-4 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                  activeTab === "products"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                🛍️ Sản phẩm
              </button>

              {isOwner && (
                <>
                  <button
                    onClick={() => {
                      if (!currentUser) {
                        handleRequireLogin();
                        return;
                      }
                      setActiveTab("manage");
                    }}
                    className={`px-4 py-4 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                      activeTab === "manage"
                        ? "border-emerald-500 text-emerald-600"
                        : "border-transparent text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    ⚙️ Quản lý
                  </button>
                  <button
                    onClick={() => {
                      if (!currentUser) {
                        handleRequireLogin();
                        return;
                      }
                      setActiveTab("orders");
                    }}
                    className={`px-4 py-4 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                      activeTab === "orders"
                        ? "border-emerald-500 text-emerald-600"
                        : "border-transparent text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    📦 Đơn hàng
                  </button>
                  <button
                    onClick={() => {
                      if (!currentUser) {
                        handleRequireLogin();
                        return;
                      }
                      setActiveTab("edit");
                    }}
                    className={`px-4 py-4 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                      activeTab === "edit"
                        ? "border-emerald-500 text-emerald-600"
                        : "border-transparent text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    ✏️ Chỉnh sửa
                  </button>
                </>
              )}

              <button
                onClick={() => setActiveTab("about")}
                className={`px-4 py-4 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                  activeTab === "about"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                ℹ️ Giới thiệu
              </button>

              <button
                onClick={() => setActiveTab("reviews")}
                className={`px-4 py-4 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                  activeTab === "reviews"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                ⭐ Đánh giá
              </button>

              <button
                onClick={() => {
                  if (!currentUser) {
                    handleRequireLogin();
                    return;
                  }
                  setActiveTab("wallet");
                }}
                className={`px-4 py-4 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                  activeTab === "wallet"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                💰 Ví & Doanh thu
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderTabContent()}
        </div>
      </div>
      <Footer />
    </div>
  );
}
