// src/components/comments/CommentList.tsx
import React, { useState, useEffect } from "react";
import {
  Filter,
  SortAsc,
  MessageSquare,
  Loader2,
  Plus,
  AlertCircle,
} from "lucide-react";
import Comment from "./Comment";
import CommentStats from "./CommentStats";

// 🟢 ĐỊNH NGHĨA CommentFilters
interface CommentFilters {
  sort: "newest" | "oldest" | "highest" | "lowest";
  filter: "all" | "purchased" | "with_content" | string;
  page: number;
  limit: number;
}

interface CommentListProps {
  productId: string;
  currentUserId?: string;
  showStats?: boolean;
  showFilters?: boolean;
  showAddButton?: boolean;
  onCommentAction?: (action: string, data?: any) => void;
  onAddComment?: () => void;
}

const CommentList: React.FC<CommentListProps> = ({
  productId,
  currentUserId,
  showStats = true,
  showFilters = true,
  showAddButton = true,
  onCommentAction,
  onAddComment,
}) => {
  const [comments, setComments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [productInfo, setProductInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const [filters, setFilters] = useState<CommentFilters>({
    sort: "newest",
    filter: "all",
    page: 1,
    limit: 10,
  });

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
      error.message?.includes("đăng nhập")
    ) {
      return "Vui lòng đăng nhập để xem đánh giá";
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

  // 🟢 FETCH COMMENTS DATA - ĐÃ THÊM AUTH VÀ XỬ LÝ LỖI
  const fetchComments = async (isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
        setError(null);
      }

      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        sort: filters.sort,
        filter: filters.filter,
      });

      const response = await fetch(
        `/api/danh-gia-san-pham/${productId}/danh-sach?${queryParams}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      console.log("📡 API Response status:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Vui lòng đăng nhập để xem đánh giá");
        }
        if (response.status === 404) {
          throw new Error("Không tìm thấy sản phẩm");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📦 API Response data:", data);

      if (data.success) {
        const items = data.data?.danhGia?.items || [];
        const pagination = data.data?.danhGia?.pagination;

        if (isLoadMore) {
          // Thêm comments mới vào danh sách hiện tại
          setComments((prev) => [...prev, ...items]);
        } else {
          // Thay thế toàn bộ comments
          setComments(items);
        }

        setStats(data.data?.thongKe || null);
        setProductInfo(data.data?.thongTinSanPham || null);

        // Kiểm tra xem còn trang tiếp theo không
        const currentPage = pagination?.page || 1;
        const totalPages = pagination?.totalPages || 1;
        setHasMore(currentPage < totalPages);

        console.log(
          `✅ Loaded ${items.length} comments, hasMore: ${
            currentPage < totalPages
          }`
        );
      } else {
        const errorMsg = data.message || "Không thể tải dữ liệu đánh giá";
        setError(errorMsg);
        onCommentAction?.("error", { message: errorMsg });
      }
    } catch (err: any) {
      const errorMessage = handleApiError(
        err,
        "Không thể tải danh sách đánh giá"
      );
      setError(errorMessage);
      onCommentAction?.("error", { message: errorMessage, error: err });
    } finally {
      setLoading(false);
    }
  };

  // 🟢 EFFECT ĐỂ FETCH COMMENTS KHI FILTER THAY ĐỔI
  useEffect(() => {
    fetchComments(false);
  }, [productId, filters.sort, filters.filter]);

  // 🟢 EFFECT ĐỂ FETCH KHI PAGE THAY ĐỔI (CHO LOAD MORE)
  useEffect(() => {
    if (filters.page > 1) {
      fetchComments(true);
    }
  }, [filters.page]);

  // 🟢 XỬ LÝ EDIT COMMENT
  const handleEditComment = (comment: any) => {
    onCommentAction?.("edit", comment);
  };

  // 🟢 XỬ LÝ DELETE COMMENT
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Bạn có chắc muốn xóa đánh giá này?")) return;

    try {
      const response = await fetch(`/api/danh-gia-san-pham/${commentId}/xoa`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Remove comment from local state
          setComments((prev) =>
            prev.filter((comment) => comment.MaDG !== commentId)
          );
          onCommentAction?.("deleted", commentId);
          // Refresh to update stats
          fetchComments(false);
        } else {
          throw new Error(result.message);
        }
      } else {
        if (response.status === 401) {
          throw new Error("Vui lòng đăng nhập để thực hiện thao tác này");
        }
        throw new Error("Không thể xóa đánh giá");
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err, "Không thể xóa đánh giá");
      alert(errorMessage);
    }
  };

  // 🟢 XỬ LÝ THAY ĐỔI SORT
  const handleSortChange = (value: string) => {
    setFilters((prev: CommentFilters) => ({
      ...prev,
      sort: value as CommentFilters["sort"],
      page: 1, // Reset về trang 1 khi thay đổi sort
    }));
  };

  // 🟢 XỬ LÝ THAY ĐỔI FILTER
  const handleFilterChange = (value: string) => {
    setFilters((prev: CommentFilters) => ({
      ...prev,
      filter: value,
      page: 1, // Reset về trang 1 khi thay đổi filter
    }));
  };

  // 🟢 XỬ LÝ LOAD MORE
  const handleLoadMore = () => {
    setFilters((prev: CommentFilters) => ({
      ...prev,
      page: prev.page + 1,
    }));
  };

  // 🟢 XỬ LÝ THÊM COMMENT
  const handleAddCommentClick = () => {
    onAddComment?.();
  };

  // 🟢 XỬ LÝ RETRY KHI CÓ LỖI
  const handleRetry = () => {
    setError(null);
    fetchComments(false);
  };

  // 🟢 LOADING STATE
  if (loading && comments.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-12 space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-gray-600">Đang tải đánh giá...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header với nút thêm đánh giá */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Đánh giá sản phẩm</h2>
        {showAddButton && (
          <button
            onClick={handleAddCommentClick}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <Plus className="w-4 h-4" />
            Viết đánh giá
          </button>
        )}
      </div>

      {/* Statistics */}
      {showStats && stats && productInfo && (
        <CommentStats
          stats={stats}
          averageRating={productInfo.DiemDG_SP}
          totalReviews={comments.length}
        />
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Sort */}
            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-gray-500" />
              <select
                value={filters.sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="highest">Điểm cao nhất</option>
                <option value="lowest">Điểm thấp nhất</option>
              </select>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filters.filter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="all">Tất cả đánh giá</option>
                <option value="purchased">Đã mua hàng</option>
                <option value="with_content">Có bình luận</option>
                <option value="5">5 sao</option>
                <option value="4">4 sao</option>
                <option value="3">3 sao</option>
                <option value="2">2 sao</option>
                <option value="1">1 sao</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Đã xảy ra lỗi
          </h3>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Thử lại
            </button>
            {error.includes("đăng nhập") && (
              <button
                onClick={() => (window.location.href = "/dang-nhap")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      )}

      {/* Comments List */}
      {!error && (
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">Chưa có đánh giá nào</p>
              <p className="text-sm text-gray-400">
                Hãy là người đầu tiên đánh giá sản phẩm này
              </p>
            </div>
          ) : (
            <>
              {comments.map((comment) => (
                <Comment
                  key={comment.MaDG}
                  comment={comment}
                  isOwner={currentUserId === comment.MaTK}
                  onEdit={handleEditComment}
                  onDelete={handleDeleteComment}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Load More */}
      {!error && comments.length > 0 && hasMore && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Đang tải..." : "Tải thêm đánh giá"}
          </button>
        </div>
      )}

      {/* End of results */}
      {!error && comments.length > 0 && !hasMore && (
        <div className="text-center py-4 text-gray-500 text-sm">
          Đã hiển thị tất cả đánh giá
        </div>
      )}

      {/* Loading more indicator */}
      {loading && comments.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      )}
    </div>
  );
};

export default CommentList;
