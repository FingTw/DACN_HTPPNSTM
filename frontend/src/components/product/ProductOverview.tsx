import React, { useState, useEffect } from "react";
import {
  Star,
  Heart,
  ShoppingCart,
  Loader2,
  AlertCircle,
  Store,
  Package,
} from "lucide-react";
import { productService, type Product } from "../../services/productService";
import { CommentList, CommentForm } from "@/components/comments";

interface ProductOverviewProps {
  productId?: string;
}

const ProductOverview: React.FC<ProductOverviewProps> = ({ productId }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

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
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Không tìm thấy sản phẩm
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
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

  return (
    <section className="py-8 bg-gradient-to-br from-emerald-50 to-teal-50 md:py-16 antialiased min-h-screen">
      <div className="max-w-screen-xl px-4 mx-auto 2xl:px-0">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-16">
          {/* Product Images */}
          <div className="shrink-0 max-w-md lg:max-w-lg mx-auto">
            <div className="relative bg-white rounded-2xl p-8 shadow-lg">
              <img
                className="w-full rounded-lg"
                src={currentImage}
                alt={product.TenSP}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/600x600?text=No+Image";
                }}
              />

              {/* Stock Badge */}
              {product.SLTonKho < 10 && product.SLTonKho > 0 && (
                <div className="absolute top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                  Chỉ còn {product.SLTonKho} sản phẩm
                </div>
              )}

              {product.SLTonKho === 0 && (
                <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                  Hết hàng
                </div>
              )}

              {/* Thumbnail Images */}
              {hasImages && product.hinhanhs!.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {product.hinhanhs?.map((img, index) => (
                    <button
                      key={img.MaHA}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                        selectedImage === index
                          ? "border-emerald-600 shadow-md"
                          : "border-gray-200 hover:border-emerald-400"
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
                            "https://via.placeholder.com/80x80?text=No+Image";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="mt-6 sm:mt-8 lg:mt-0">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {product.TenSP}
            </h1>

            {/* Store Info */}
            {product.cuahang && (
              <div className="mt-3 flex items-center gap-2 text-gray-600">
                <Store className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-emerald-700">
                  {product.cuahang.TenCH}
                </span>
                <span className="text-gray-400">•</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm">
                    {product.cuahang.DiemDG?.toFixed(1) ?? "0.0"}
                  </span>
                </div>
              </div>
            )}

            {/* Price and Rating */}
            <div className="mt-4 sm:items-center sm:gap-4 sm:flex">
              <p className="text-3xl font-extrabold text-emerald-600 sm:text-4xl">
                {formatPrice(Number(product.GiaBan))}
              </p>

              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <div className="flex items-center gap-1">
                  {renderStars(averageRating)}
                </div>
                <p className="text-sm font-medium text-gray-500">
                  ({averageRating.toFixed(1)})
                </p>
              </div>
            </div>

            {/* Product Details */}
            <div className="mt-6 space-y-3">
              {product.NguonGoc && (
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" />
                  <span className="text-gray-700">
                    <span className="font-medium">Xuất xứ:</span>{" "}
                    {product.NguonGoc}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <span className="text-gray-700">
                  <span className="font-medium">Tình trạng:</span>{" "}
                  <span
                    className={
                      product.SLTonKho > 0 ? "text-emerald-600" : "text-red-600"
                    }
                  >
                    {product.SLTonKho > 0
                      ? `Còn ${product.SLTonKho} sản phẩm`
                      : "Hết hàng"}
                  </span>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 sm:gap-4 sm:items-center sm:flex sm:mt-8">
              <button
                onClick={toggleFavorite}
                className={`flex items-center justify-center py-3 px-5 text-sm font-medium rounded-lg border-2 transition ${
                  isFavorite
                    ? "bg-emerald-50 border-emerald-600 text-emerald-700"
                    : "bg-white border-gray-300 text-gray-700 hover:border-emerald-600 hover:text-emerald-600"
                }`}
              >
                <Heart
                  className={`w-5 h-5 -ms-2 me-2 ${
                    isFavorite ? "fill-emerald-600" : ""
                  }`}
                />
                {isFavorite ? "Đã yêu thích" : "Yêu thích"}
              </button>

              <button
                onClick={handleAddToCart}
                disabled={product.SLTonKho === 0}
                className={`text-white mt-4 sm:mt-0 font-medium rounded-lg text-sm px-5 py-3 flex items-center justify-center transition ${
                  product.SLTonKho === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl"
                }`}
              >
                <ShoppingCart className="w-5 h-5 -ms-2 me-2" />
                {product.SLTonKho === 0 ? "Hết hàng" : "Thêm vào giỏ"}
              </button>
            </div>

            <hr className="my-6 md:my-8 border-gray-300" />

            {/* Product Description */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Mô tả sản phẩm
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {product.MoTa || "Chưa có mô tả cho sản phẩm này."}
              </p>
            </div>

            {/* Categories */}
            {product.sanpham_danhmucs?.length ? (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Danh mục:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.sanpham_danhmucs.map((item) => (
                    <span
                      key={item.MaSP_DM}
                      className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium"
                    >
                      {item.danhmuc.TenDM}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Reviews Section - CHỈ DÙNG CommentList */}
        <div id="reviews" className="mt-12">
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
    </section>
  );
};

export default ProductOverview;
