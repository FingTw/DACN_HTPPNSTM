// src/pages/rfq/seller/SellerMyProposals.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useSellerProposals,
  useUpdateProposal,
  useCancelProposal,
} from "@/hooks/useRFQ";
import { Edit2, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";

// Format ngày tiếng Việt không cần date-fns
const formatDateVN = (dateString: string) => {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
};

const statusConfig: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  Pending: {
    label: "Đang chờ",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  Accepted: {
    label: "Đã chấp nhận",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  Rejected: {
    label: "Bị từ chối",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
};

export default function SellerMyProposals() {
  const [filters, setFilters] = useState<{ TrangThai?: string; page?: number }>(
    {
      page: 1,
    }
  );

  const { proposals, loading, pagination, refetch } = useSellerProposals(
    true,
    filters
  );
  const { updateProposal, loading: updating } = useUpdateProposal();
  const { cancelProposal, loading: canceling } = useCancelProposal();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    SoLuongCungCap: 0,
    GiaDeNghi: 0,
    ChatLuongDeNghi: "",
  });

  const startEdit = (prop: any) => {
    setEditingId(prop.MaDNCC);
    setEditForm({
      SoLuongCungCap: prop.SoLuongCungCap,
      GiaDeNghi: prop.GiaDeNghi,
      ChatLuongDeNghi: prop.ChatLuongDeNghi || "",
    });
  };

  const saveEdit = async (MaDNCC: string) => {
    try {
      await updateProposal(MaDNCC, editForm);
      setEditingId(null);
      refetch();
    } catch (err) {
      alert("Cập nhật thất bại");
    }
  };

  const handleCancel = async (MaDNCC: string) => {
    if (!confirm("Bạn chắc chắn muốn hủy đề nghị này?")) return;
    try {
      await cancelProposal(MaDNCC);
      refetch();
    } catch (err) {
      alert("Hủy thất bại");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Đề nghị của tôi</h1>
          <p className="text-gray-600 mt-1">
            Quản lý tất cả đề nghị bạn đã gửi
          </p>
        </div>

        {/* Filter trạng thái */}
        <select
          value={filters.TrangThai || ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              TrangThai: e.target.value || undefined,
              page: 1,
            })
          }
          className="px-5 py-3 border rounded-lg text-lg"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Pending">Đang chờ</option>
          <option value="Accepted">Đã chấp nhận</option>
          <option value="Rejected">Bị từ chối</option>
        </select>
      </div>

      {/* Danh sách đề nghị */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            Đang tải đề nghị...
          </div>
        ) : proposals.length === 0 ? (
          <div className="p-16 text-center">
            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-xl text-gray-600 mb-4">
              Bạn chưa gửi đề nghị nào
            </p>
            <Link
              to="/rfq/seller/requests"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
            >
              Tìm yêu cầu ngay →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {proposals.map((prop) => {
              const status =
                statusConfig[prop.TrangThai] || statusConfig.Pending;
              const Icon = status.icon;
              const request = prop.MaYCDH_yeucaudathang;
              const product = prop.MaSP_sanpham;

              return (
                <div
                  key={prop.MaDNCC}
                  className="p-6 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      {/* Tiêu đề yêu cầu */}
                      <Link
                        to={`/rfq/seller/requests/${prop.MaYCDH}`}
                        className="font-semibold text-lg hover:text-blue-600 transition"
                      >
                        {request?.TenSP_YeuCau || "Yêu cầu #" + prop.MaYCDH}
                      </Link>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Sản phẩm:</span>
                          <p className="font-medium">{product?.TenSP}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Số lượng:</span>
                          <p className="font-medium">{prop.SoLuongCungCap}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Giá đề nghị:</span>
                          <p className="font-medium text-green-600">
                            {prop.GiaDeNghi.toLocaleString("vi-VN")} ₫
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Gửi lúc:</span>
                          <p className="font-medium">
                            {formatDateVN(prop.NgayDeNghi)}
                          </p>
                        </div>
                      </div>

                      {prop.ChatLuongDeNghi && (
                        <p className="text-sm text-gray-600 mt-3 italic">
                          "{prop.ChatLuongDeNghi}"
                        </p>
                      )}
                    </div>

                    {/* Trạng thái + Hành động */}
                    <div className="flex flex-col items-end gap-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${status.color}`}
                        >
                          <Icon className="w-4 h-4" />
                          {status.label}
                        </span>
                      </div>

                      {prop.TrangThai === "Pending" && (
                        <div className="flex gap-2">
                          {editingId === prop.MaDNCC ? (
                            <>
                              <button
                                onClick={() => saveEdit(prop.MaDNCC)}
                                disabled={updating}
                                className="p-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-70"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(prop)}
                                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                title="Chỉnh sửa"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancel(prop.MaDNCC)}
                                disabled={canceling}
                                className="p-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-70"
                                title="Hủy đề nghị"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form chỉnh sửa (hiển thị khi đang edit) */}
                  {editingId === prop.MaDNCC && (
                    <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Số lượng
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editForm.SoLuongCungCap}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              SoLuongCungCap: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Giá đề nghị
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editForm.GiaDeNghi}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              GiaDeNghi: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Mô tả chất lượng
                        </label>
                        <input
                          type="text"
                          value={editForm.ChatLuongDeNghi}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              ChatLuongDeNghi: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="Không bắt buộc"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t flex justify-center gap-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (p) => (
                <button
                  key={p}
                  onClick={() => setFilters({ ...filters, page: p })}
                  className={`px-4 py-2 rounded-lg transition ${
                    p === pagination.page
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
