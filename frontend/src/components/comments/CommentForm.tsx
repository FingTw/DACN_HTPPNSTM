// src/components/comments/CommentForm.tsx
import React, { useState, useEffect } from "react";
import { X, Star, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface CommentFormProps {
  productId: string;
  productName?: string;
  editData?: any;
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
}

const CommentForm: React.FC<CommentFormProps> = ({
  productId,
  productName,
  editData,
  onSuccess,
  onCancel,
  onError,
}) => {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [purchased, setPurchased] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editData) {
      setRating(editData.Diem);
      setContent(editData.NoiDung || "");
      setPurchased(editData.DaMua);
    }
  }, [editData]);

  // 🟢 HÀM LẤY TOKEN TỪ LOCALSTORAGE
  const getAuthToken = (): string | null => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("authToken") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("authToken")
      );
    }
    return null;
  };

  // 🟢 HÀM TẠO HEADERS VỚI AUTH
  const getAuthHeaders = (): HeadersInit => {
    const token = getAuthToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  };

  // 🟢 HÀM XỬ LÝ LỖI CHUNG
  const handleApiError = (error: any, defaultMessage: string) => {
    console.error("API Error:", error);

    if (
      error.message?.includes("401") ||
      error.message?.includes("đăng nhập") ||
      error.message?.includes("Token")
    ) {
      return "Vui lòng đăng nhập để thực hiện đánh giá";
    }

    if (error.message?.includes("404")) {
      return "Không tìm thấy sản phẩm hoặc đánh giá";
    }

    if (
      error.message?.includes("network") ||
      error.message?.includes("fetch")
    ) {
      return "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.";
    }

    return error.message || defaultMessage;
  };

  // 🟢 VALIDATE FORM
  const validateForm = (): boolean => {
    if (rating === 0) {
      setError("Vui lòng chọn số sao đánh giá");
      return false;
    }
    if (!content.trim()) {
      setError("Vui lòng nhập nội dung đánh giá");
      return false;
    }
    if (content.trim().length < 10) {
      setError("Nội dung đánh giá phải có ít nhất 10 ký tự");
      return false;
    }
    setError(null);
    return true;
  };

  // 🟢 XỬ LÝ GỬI ĐÁNH GIÁ - ĐÃ THÊM AUTH VÀ XỬ LÝ LỖI
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // 🟢 KIỂM TRA ĐĂNG NHẬP TRƯỚC KHI GỬI
      const token = getAuthToken();
      if (!token) {
        throw new Error("Vui lòng đăng nhập để đánh giá sản phẩm");
      }

      const reviewData = {
        Diem: rating,
        NoiDung: content,
        DaMua: purchased,
      };

      console.log("📤 Submitting review:", reviewData);

      let url: string;
      let method: string;

      if (editData) {
        // Update existing review
        url = `/api/danh-gia-san-pham/${editData.MaDG}/cap-nhat`;
        method = "PUT";
      } else {
        // Create new review
        url = `/api/danh-gia-san-pham/${productId}/them-moi`;
        method = "POST";
      }

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(reviewData),
      });

      console.log("📡 Response status:", response.status);

      // 🟢 XỬ LÝ RESPONSE
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
          );
        }
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Dữ liệu không hợp lệ");
        }
        if (response.status === 404) {
          throw new Error("Không tìm thấy sản phẩm hoặc đánh giá");
        }
        if (response.status === 403) {
          throw new Error("Bạn không có quyền thực hiện thao tác này");
        }
        throw new Error(`Lỗi server: ${response.status}`);
      }

      // 🟢 XỬ LÝ JSON RESPONSE
      let result;
      try {
        const responseText = await response.text();
        console.log("📦 Raw response:", responseText);

        if (responseText) {
          result = JSON.parse(responseText);
        } else {
          result = { success: true };
        }
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        if (response.ok) {
          result = { success: true };
        } else {
          throw new Error("Phản hồi từ server không hợp lệ");
        }
      }

      // 🟢 KIỂM TRA KẾT QUẢ
      if (result && result.success !== false) {
        console.log("✅ Review submitted successfully:", result);
        onSuccess?.(result);
      } else {
        throw new Error(result?.message || "Không thể gửi đánh giá");
      }
    } catch (err: any) {
      const errorMessage = handleApiError(
        err,
        "Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại."
      );
      console.error("❌ Submit error:", errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);

      // 🟢 HIỂN THỊ THÔNG BÁO LỖI PHÙ HỢP
      if (errorMessage.includes("đăng nhập")) {
        const shouldLogin = confirm(
          `${errorMessage}\n\nBạn có muốn chuyển đến trang đăng nhập không?`
        );
        if (shouldLogin) {
          window.location.href = "/dang-nhap";
        }
      } else {
        // Không hiển thị alert ở đây nữa, để error message trong form
      }
    } finally {
      setLoading(false);
    }
  };

  // 🟢 COMPONENT STAR RATING
  const StarRatingInput: React.FC = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className={`p-1 transition-transform hover:scale-110 focus:outline-none ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            <Star
              className={`w-8 h-8 ${
                star <= (hoveredRating || rating)
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
        <span
          className={`ml-2 text-sm text-gray-600 ${
            loading ? "opacity-50" : ""
          }`}
        >
          {rating > 0 ? `${rating}/5 sao` : "Chọn số sao"}
        </span>
      </div>
    );
  };

  // 🟢 XỬ LÝ ĐÓNG FORM
  const handleClose = () => {
    if (loading) {
      const confirmClose = confirm(
        "Đánh giá đang được gửi. Bạn có chắc muốn hủy?"
      );
      if (!confirmClose) return;
    }
    onCancel?.();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {editData ? "Chỉnh sửa đánh giá" : "Viết đánh giá"}
          </h2>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg transition ${
              loading
                ? "text-gray-400 cursor-not-allowed"
                : "hover:bg-gray-100 text-gray-500"
            }`}
            disabled={loading}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Info */}
          {productName && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-900 text-sm mb-1">
                Sản phẩm:
              </h3>
              <p className="text-blue-700 font-medium">{productName}</p>
            </div>
          )}

          {/* Rating */}
          <div>
            <label
              className={`block text-sm font-medium text-gray-700 mb-3 ${
                loading ? "opacity-50" : ""
              }`}
            >
              Đánh giá của bạn *
            </label>
            <StarRatingInput />
          </div>

          {/* Purchased Checkbox */}
          <div className="flex items-center gap-3">
            <label
              className={`flex items-center gap-2 cursor-pointer ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <div className="relative">
                <input
                  type="checkbox"
                  checked={purchased}
                  onChange={(e) => !loading && setPurchased(e.target.checked)}
                  className="sr-only"
                  disabled={loading}
                />
                <div
                  className={`w-5 h-5 border-2 rounded flex items-center justify-center transition ${
                    purchased
                      ? "bg-emerald-500 border-emerald-500"
                      : "bg-white border-gray-300"
                  } ${loading ? "opacity-50" : "cursor-pointer"}`}
                >
                  {purchased && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
              </div>
              <span className="text-sm text-gray-700 flex items-center gap-1">
                Tôi đã mua sản phẩm này
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </span>
            </label>
          </div>

          {/* Content */}
          <div>
            <label
              className={`block text-sm font-medium text-gray-700 mb-3 ${
                loading ? "opacity-50" : ""
              }`}
            >
              Nội dung đánh giá *
            </label>
            <textarea
              value={content}
              onChange={(e) => !loading && setContent(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
              rows={6}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition ${
                loading
                  ? "opacity-50 cursor-not-allowed bg-gray-50"
                  : "bg-white"
              }`}
              maxLength={1000}
              disabled={loading}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Ít nhất 10 ký tự</span>
              <span>{content.length}/1000</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-700 text-sm font-medium mb-1">
                  Đã xảy ra lỗi
                </p>
                <p className="text-red-600 text-sm">{error}</p>
                {error.includes("đăng nhập") && (
                  <button
                    type="button"
                    onClick={() => (window.location.href = "/dang-nhap")}
                    className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                  >
                    Đăng nhập ngay
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                rating === 0 ||
                !content.trim() ||
                content.trim().length < 10
              }
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang gửi...
                </>
              ) : editData ? (
                "Cập nhật đánh giá"
              ) : (
                "Gửi đánh giá"
              )}
            </button>
          </div>

          {/* Tips */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 text-sm mb-2 flex items-center gap-2">
              <span className="text-blue-500">💡</span>
              Mẹo viết đánh giá hay:
            </h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Chia sẻ trải nghiệm thực tế khi sử dụng sản phẩm</li>
              <li>• Nêu rõ điểm bạn thích và chưa thích</li>
              <li>• Ảnh thực tế sẽ giúp đánh giá thêm tin cậy</li>
              <li>• Đánh giá trung thực, khách quan giúp người khác</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentForm;
