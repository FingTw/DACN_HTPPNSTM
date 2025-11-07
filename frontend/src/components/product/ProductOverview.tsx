import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { productService, type Product } from "../../services/productService";
import { CommentList, CommentForm } from "@/components/comments";
import { Header } from "../layout/Header";
import { Link } from "react-router-dom";

interface ProductOverviewProps {
  productId?: string;
}

const ProductOverview: React.FC<ProductOverviewProps> = ({ productId }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // State cho chức năng đánh giá
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [refreshComments, setRefreshComments] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const id = productId || window.location.pathname.split("/").pop();
        if (!id) {
          setError("Không tìm thấy mã sản phẩm");
          return;
        }

        const data = await productService.getProductById(id);

        if (data) setProduct(data);
        else setError("Không tìm thấy sản phẩm");
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < Math.floor(rating)
            ? "text-yellow-400 fill-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (product.SLTonKho === 0) {
      alert("Sản phẩm đã hết hàng!");
      return;
    }

    alert(`Đã thêm "${product.TenSP}" vào giỏ hàng!`);
  };

  const toggleFavorite = () => {
    setIsFavorite((prev) => !prev);
  };

  const handleCommentAction = (action: string, data?: any) => {
    console.log("Comment action:", action, data);
    if (action === "deleted" || action === "created" || action === "updated") {
      setRefreshComments((prev) => prev + 1);
    }
  };

  const handleAddComment = () => {
    setShowCommentForm(true);
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.SLTonKho || 1)) {
      setQuantity(newQuantity);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Không tìm thấy sản phẩm
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition duration-200 font-medium"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const hasImages = product.hinhanhs && product.hinhanhs.length > 0;
  const currentImage = hasImages
    ? product.hinhanhs?.[selectedImage]?.URL
    : "https://via.placeholder.com/600x600?text=No+Image";
  const averageRating = product.DiemDG_SP ?? 0;
  const totalPrice = Number(product.GiaBan) * quantity;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link
            to="/"
            className="hover:text-emerald-600 transition duration-200"
          >
            🏠 Trang chủ
          </Link>
          <span>›</span>
          <span className="text-emerald-600 font-medium">{product.TenSP}</span>
        </nav>

        {/* 🟢 SỬA: CHUYỂN SANG LAYOUT NGANG */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images (Thu nhỏ lại) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-4">
                {/* 🟢 THU NHỎ HÌNH CHÍNH */}
                <div className="relative bg-white rounded-xl">
                  <img
                    className="w-full h-64 object-contain rounded-lg"
                    src={currentImage}
                    alt={product.TenSP}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/400x400?text=No+Image";
                    }}
                  />

                  {/* Stock Badge */}
                  {product.SLTonKho < 10 && product.SLTonKho > 0 && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                      Chỉ còn {product.SLTonKho}
                    </div>
                  )}

                  {product.SLTonKho === 0 && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                      Hết hàng
                    </div>
                  )}
                </div>

                {/* Thumbnail Images */}
                {hasImages && product.hinhanhs!.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                    {product.hinhanhs?.map((img, index) => (
                      <button
                        key={img.MaHA}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          selectedImage === index
                            ? "border-emerald-500 shadow-md"
                            : "border-gray-200 hover:border-emerald-300"
                        }`}
                      >
                        <img
                          src={img.URL}
                          alt={img.MoTa || `Ảnh ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(
                            e: React.SyntheticEvent<HTMLImageElement>
                          ) => {
                            e.currentTarget.src =
                              "https://via.placeholder.com/64x64?text=No+Image";
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle Column - Product Info (Chiếm 2/3) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
              {/* Product Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                  {product.TenSP}
                </h1>

                {/* Store Info */}
                {product.cuahang && (
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <Store className="w-5 h-5 text-emerald-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-emerald-700 text-sm">
                        {product.cuahang.TenCH}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="font-medium">
                            {product.cuahang.DiemDG?.toFixed(1) ?? "0.0"}
                          </span>
                        </div>
                        <span>•</span>
                        <span>1.2k theo dõi</span>
                      </div>
                    </div>
                    <Link
                      to={`/cuahang/${product.cuahang.MaCH}`}
                      className="text-emerald-600 hover:text-emerald-700 font-medium text-xs"
                    >
                      Xem shop
                    </Link>
                  </div>
                )}
              </div>

              {/* 🟢 SỬA: CHUYỂN THÔNG TIN SANG LAYOUT 2 CỘT NGANG */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Info Column */}
                <div className="space-y-4">
                  {/* Rating */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {renderStars(averageRating)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-semibold text-gray-700">
                        {averageRating.toFixed(1)}
                      </span>
                      <span>|</span>
                      <span>128 đánh giá</span>
                      <span>|</span>
                      <span>512 đã bán</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-emerald-600">
                        {formatPrice(Number(product.GiaBan))}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(Number(product.GiaBan) * 1.2)}
                      </span>
                      <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                        -20%
                      </span>
                    </div>
                    <p className="text-green-600 font-medium text-sm mt-1">
                      🎉 Tiết kiệm {formatPrice(Number(product.GiaBan) * 0.2)}
                    </p>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-gray-700">
                        <span className="font-medium">Bảo hành:</span> 12 tháng
                      </span>
                    </div>

                    {product.NguonGoc && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm text-gray-700">
                          <span className="font-medium">Xuất xứ:</span>{" "}
                          {product.NguonGoc}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-gray-700">
                        <span className="font-medium">Vận chuyển:</span> Miễn
                        phí
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-gray-700">
                        <span className="font-medium">Tình trạng:</span>{" "}
                        <span
                          className={
                            product.SLTonKho > 0
                              ? "text-emerald-600 font-semibold"
                              : "text-red-600 font-semibold"
                          }
                        >
                          {product.SLTonKho > 0
                            ? `Còn ${product.SLTonKho} sản phẩm`
                            : "Hết hàng"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action Column */}
                <div className="space-y-4">
                  {/* Quantity Selector */}
                  <div>
                    <p className="text-gray-700 font-medium mb-2 text-sm">
                      Số lượng
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <button
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                          className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          -
                        </button>
                        <span className="w-10 h-10 flex items-center justify-center font-semibold">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(1)}
                          disabled={quantity >= (product.SLTonKho || 1)}
                          className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-gray-600 text-xs">
                        {product.SLTonKho} sản phẩm có sẵn
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <button
                        onClick={toggleFavorite}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-lg border-2 transition duration-200 ${
                          isFavorite
                            ? "bg-red-50 border-red-500 text-red-600"
                            : "bg-white border-gray-300 text-gray-700 hover:border-red-400 hover:text-red-500"
                        }`}
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            isFavorite ? "fill-red-500" : ""
                          }`}
                        />
                        {isFavorite ? "Đã thích" : "Yêu thích"}
                      </button>

                      <button
                        onClick={handleAddToCart}
                        disabled={product.SLTonKho === 0}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-lg transition duration-200 ${
                          product.SLTonKho === 0
                            ? "bg-gray-400 cursor-not-allowed text-white"
                            : "bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl"
                        }`}
                      >
                        <ShoppingCart className="w-5 h-5" />
                        Thêm giỏ hàng
                      </button>
                    </div>

                    {/* Buy Now Button */}
                    <button
                      disabled={product.SLTonKho === 0}
                      className={`w-full py-3 px-4 text-sm font-semibold rounded-lg transition duration-200 ${
                        product.SLTonKho === 0
                          ? "bg-gray-400 cursor-not-allowed text-white"
                          : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl"
                      }`}
                    >
                      {product.SLTonKho === 0 ? "Hết hàng" : "Mua ngay"}
                    </button>
                  </div>

                  {/* Order Summary Mini */}
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Tạm tính:</span>
                      <span>{formatPrice(Number(product.GiaBan))}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Số lượng:</span>
                      <span>{quantity}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Giảm giá:</span>
                      <span className="text-green-600">
                        -{formatPrice(Number(product.GiaBan) * 0.2)}
                      </span>
                    </div>
                    <hr className="border-gray-300 my-2" />
                    <div className="flex justify-between font-bold">
                      <span>Tổng tiền:</span>
                      <span className="text-emerald-600">
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="mt-8">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Mô tả sản phẩm
            </h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {product.MoTa || "Chưa có mô tả cho sản phẩm này."}
              </p>
            </div>

            {/* Categories */}
            {product.sanpham_danhmucs?.length ? (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-md font-semibold text-gray-700 mb-3">
                  Danh mục sản phẩm:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.sanpham_danhmucs.map((item) => (
                    <span
                      key={item.MaSP_DM}
                      className="px-3 py-1 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200"
                    >
                      {item.danhmuc.TenDM}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
            <CommentList
              productId={product.MaSP}
              showStats={true}
              showFilters={true}
              showAddButton={true}
              onCommentAction={handleCommentAction}
              onAddComment={handleAddComment}
              key={refreshComments}
            />
          </div>
        </div>
        {/* Comment Form Modal */}
        {showCommentForm && (
          <CommentForm
            productId={product.MaSP}
            productName={product.TenSP}
            onSuccess={() => {
              setShowCommentForm(false);
              setRefreshComments((prev) => prev + 1);
            }}
            onCancel={() => setShowCommentForm(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ProductOverview;
