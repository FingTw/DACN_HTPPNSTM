// src/pages/RequestsMarketplace.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useBuyerRequests,
  useSellerRequests,
  useCreateRequest,
} from "../hooks/useRFQ";

export const RequestsMarketplace = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(() => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user).role : "";
  });

  // States cho modal tạo yêu cầu
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    TenSP_YeuCau: "",
    SoLuongYeuCau: 0,
    ChatLuongYeuCau: "",
    GiaMongMuon: 0,
  });

  // Hooks
  const isBuyer = userRole === "Buyer" || userRole === "Admin";
  const isSeller = userRole === "Seller" || userRole === "Admin";

  const buyerRequestsData = useBuyerRequests(isBuyer);
  const sellerRequestsData = useSellerRequests(isSeller);
  const { createRequest, loading: creating } = useCreateRequest();

  // Chọn data phù hợp với role
  const { requests, loading, error, refetch } = isBuyer
    ? buyerRequestsData
    : sellerRequestsData;

  // Xử lý tạo yêu cầu
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRequest(formData);
      alert("✅ Tạo yêu cầu thành công!");
      setShowCreateModal(false);
      setFormData({
        TenSP_YeuCau: "",
        SoLuongYeuCau: 0,
        ChatLuongYeuCau: "",
        GiaMongMuon: 0,
      });
      refetch();
    } catch (err) {
      alert("❌ Lỗi: " + err);
    }
  };

  // Tính ngày còn lại
  const getDaysRemaining = (thoihan: string) => {
    const today = new Date();
    const deadline = new Date(thoihan);
    const diffDays = Math.ceil(
      (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays;
  };

  // Status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Open: "bg-green-100 text-green-700 border-green-300",
      PartiallyFilled: "bg-yellow-100 text-yellow-700 border-yellow-300",
      Completed: "bg-blue-100 text-blue-700 border-blue-300",
      Expired: "bg-red-100 text-red-700 border-red-300",
    };
    return colors[status] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="text-red-500 text-6xl mb-4 text-center">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
            Có lỗi xảy ra
          </h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <button
            onClick={refetch}
            className="w-full bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 transition-colors font-medium"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                🌾 Marketplace Nông Sản
              </h1>
              <p className="text-gray-600 mt-1">
                {isBuyer && "Quản lý yêu cầu mua hàng của bạn"}
                {isSeller && "Tìm kiếm và cung cấp cho yêu cầu"}
              </p>
            </div>

            <div className="flex gap-3">
              {isBuyer && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                >
                  <span className="text-xl">➕</span>
                  Tạo Yêu Cầu Mới
                </button>
              )}
              <button
                onClick={refetch}
                className="flex items-center gap-2 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:border-gray-400 hover:shadow-md transition-all font-medium"
              >
                <span className="text-xl">🔄</span>
                Làm mới
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Tổng yêu cầu
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {requests.length}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-4">
                <span className="text-3xl">📦</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Đang mở</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {requests.filter((r) => r.TrangThai === "Open").length}
                </p>
              </div>
              <div className="bg-yellow-100 rounded-full p-4">
                <span className="text-3xl">🔓</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Hoàn thành</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {requests.filter((r) => r.TrangThai === "Completed").length}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-4">
                <span className="text-3xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Requests Grid */}
        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Chưa có yêu cầu nào
            </h3>
            <p className="text-gray-600 mb-6">
              {isBuyer && "Hãy tạo yêu cầu mua hàng đầu tiên của bạn!"}
              {isSeller && "Chưa có yêu cầu mở nào. Vui lòng quay lại sau."}
            </p>
            {isBuyer && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-medium"
              >
                Tạo Yêu Cầu Ngay
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request: any) => {
              const daysLeft = getDaysRemaining(request.ThoiHan);
              const isUrgent = daysLeft <= 2;

              return (
                <div
                  key={request.MaYCDH}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:scale-105"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-green-500 to-blue-500 p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="text-white font-bold text-lg flex-1 pr-2">
                        {request.TenSP_YeuCau}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          request.TrangThai
                        )}`}
                      >
                        {request.TrangThai === "Open" && "🔓 Đang mở"}
                        {request.TrangThai === "PartiallyFilled" &&
                          "⏳ Một phần"}
                        {request.TrangThai === "Completed" && "✅ Hoàn thành"}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    {/* Buyer Info (for seller view) */}
                    {isSeller && request.MaTK_Buyer_taikhoan && (
                      <div className="bg-blue-50 rounded-xl p-3 mb-4">
                        <p className="text-xs text-blue-600 font-medium mb-1">
                          👤 Người mua
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                          {request.MaTK_Buyer_taikhoan.HoTen}
                        </p>
                        {request.MaTK_Buyer_taikhoan.DiaChi && (
                          <p className="text-xs text-gray-600">
                            📍 {request.MaTK_Buyer_taikhoan.DiaChi}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Quantity & Price */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-600 mb-1">Số lượng</p>
                        <p className="text-lg font-bold text-gray-800">
                          {request.SoLuongYeuCau}{" "}
                          <span className="text-sm font-normal">kg</span>
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-600 mb-1">
                          Giá mong muốn
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          {request.GiaMongMuon?.toLocaleString()}
                          <span className="text-sm font-normal">đ</span>
                        </p>
                      </div>
                    </div>

                    {/* Progress bar (if partial) */}
                    {request.TrangThai === "PartiallyFilled" &&
                      request.remaining !== undefined && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Tiến độ</span>
                            <span>
                              Còn thiếu: <strong>{request.remaining} kg</strong>
                            </span>
                          </div>
                          <div className="bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
                              style={{
                                width: `${
                                  ((request.SoLuongYeuCau - request.remaining) /
                                    request.SoLuongYeuCau) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                    {/* Quality Requirements */}
                    {request.ChatLuongYeuCau && (
                      <div className="bg-amber-50 rounded-xl p-3 mb-4">
                        <p className="text-xs text-amber-700 font-medium mb-1">
                          📋 Yêu cầu chất lượng
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {request.ChatLuongYeuCau}
                        </p>
                      </div>
                    )}

                    {/* Deadline */}
                    <div
                      className={`rounded-xl p-3 mb-4 ${
                        isUrgent
                          ? "bg-red-50 border border-red-200"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">
                            ⏰ Thời hạn
                          </p>
                          <p className="text-sm font-semibold text-gray-800">
                            {new Date(request.ThoiHan).toLocaleDateString(
                              "vi-VN"
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-2xl font-bold ${
                              isUrgent ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {daysLeft}
                          </p>
                          <p className="text-xs text-gray-600">ngày</p>
                        </div>
                      </div>
                    </div>

                    {/* Proposals count (for buyer) */}
                    {isBuyer && request.denghicungcaps && (
                      <div className="bg-purple-50 rounded-xl p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-purple-700 font-medium">
                            💼 Đề nghị nhận được
                          </span>
                          <span className="text-xl font-bold text-purple-600">
                            {request.denghicungcaps.length}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {isBuyer && (
                        <button
                          onClick={() =>
                            navigate(
                              `/buyer/requests/${request.MaYCDH}/proposals`
                            )
                          }
                          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-medium shadow-md hover:shadow-lg"
                        >
                          Xem Đề Nghị
                        </button>
                      )}
                      {isSeller && (
                        <button
                          onClick={() =>
                            navigate(
                              `/seller/submit-proposal/${request.MaYCDH}`
                            )
                          }
                          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-medium shadow-md hover:shadow-lg"
                        >
                          ✨ Cung Cấp
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Tạo Yêu Cầu */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6 text-white">
              <h2 className="text-2xl font-bold">
                🌾 Tạo Yêu Cầu Mua Hàng Mới
              </h2>
              <p className="text-green-100 mt-1">
                Điền thông tin sản phẩm bạn cần mua
              </p>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tên sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.TenSP_YeuCau}
                    onChange={(e) =>
                      setFormData({ ...formData, TenSP_YeuCau: e.target.value })
                    }
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    placeholder="VD: Cà chua bi, Xoài cát..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Số lượng (kg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.SoLuongYeuCau || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          SoLuongYeuCau: +e.target.value,
                        })
                      }
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      min="1"
                      placeholder="100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Giá mong muốn (đ/kg)
                    </label>
                    <input
                      type="number"
                      value={formData.GiaMongMuon || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          GiaMongMuon: +e.target.value,
                        })
                      }
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      min="0"
                      placeholder="25000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Yêu cầu chất lượng
                  </label>
                  <textarea
                    value={formData.ChatLuongYeuCau}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ChatLuongYeuCau: e.target.value,
                      })
                    }
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    rows={4}
                    placeholder="VD: Size 2-3cm, độ chín 80%, không dập nát, ưu tiên organic..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition-all font-medium"
                  disabled={creating}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {creating ? "⏳ Đang tạo..." : "✨ Tạo Yêu Cầu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
