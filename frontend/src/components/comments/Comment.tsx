import React from "react";
import { Star, Edit, Trash2, User, ShoppingBag } from "lucide-react";

interface CommentProps {
  comment: any;
  isOwner?: boolean;
  onEdit?: (comment: any) => void;
  onDelete?: (commentId: string) => void;
}

const Comment: React.FC<CommentProps> = ({
  comment,
  isOwner = false,
  onEdit,
  onDelete,
}) => {
  // 🟢 SỬA: Lấy thông tin user từ nguoidanhgia thay vì taikhoan
  const user = comment.nguoidanhgia || {};
  const userName = user.TenDangNhap || "Người dùng";
  const userInitial = userName.charAt(0).toUpperCase();

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            {userInitial ? (
              <span className="text-blue-600 font-medium text-sm">
                {userInitial}
              </span>
            ) : (
              <User className="w-5 h-5 text-blue-600" />
            )}
          </div>

          {/* User Info */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{userName}</span>
              {isOwner && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Bạn
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {/* Rating */}
              <div className="flex items-center gap-1">
                {renderStars(comment.Diem)}
              </div>
              {/* Date */}
              <span className="text-sm text-gray-500">
                {formatDate(comment.NgayDG)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isOwner && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit?.(comment)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="Chỉnh sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete?.(comment.MaDG)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
          {comment.NoiDung}
        </p>
      </div>

      {/* Purchase Badge */}
      {comment.DaMua && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
            <ShoppingBag className="w-3 h-3" />
            Đã mua hàng
          </span>
        </div>
      )}
    </div>
  );
};

export default Comment;
