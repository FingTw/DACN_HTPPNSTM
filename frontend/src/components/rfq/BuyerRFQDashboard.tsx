// src/pages/buyer/BuyerRFQDashboard.tsx
import React, { useState } from "react";
import {
  useBuyerRequests,
  useCreateRequest,
  useProposalsForRequest,
  useAcceptProposal,
  useRejectProposal,
} from "../../hooks/useRFQ";
import {
  Plus,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Loader2,
} from "lucide-react";

export const BuyerRFQDashboard = () => {
  const { requests, loading, error, refetch } = useBuyerRequests(true);
  const { createRequest, loading: creating } = useCreateRequest();
  const { acceptProposal } = useAcceptProposal();
  const { rejectProposal } = useRejectProposal();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const { data: selectedData, refetch: refetchProposals } =
    useProposalsForRequest(selectedRequest || "");

  const [form, setForm] = useState({
    TenSP_YeuCau: "",
    SoLuongYeuCau: 50,
    ChatLuongYeuCau: "",
    GiaMongMuon: 0,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRequest(form);
      setShowCreateModal(false);
      setForm({
        TenSP_YeuCau: "",
        SoLuongYeuCau: 50,
        ChatLuongYeuCau: "",
        GiaMongMuon: 0,
      });
      refetch();
    } catch (err) {
      /* error handled in hook */
    }
  };

  const handleAccept = async (MaDNCC: string) => {
    if (!confirm("Chấp nhận đề nghị này?")) return;
    await acceptProposal({ MaDNCC });
    refetchProposals();
    refetch();
  };

  const handleReject = async (MaDNCC: string) => {
    const reason = prompt("Lý do từ chối (không bắt buộc):");
    await rejectProposal(MaDNCC, reason || undefined);
    refetchProposals();
  };

  if (loading)
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-3">Yêu Cầu Mua Hàng Của Tôi</h1>
          <p className="text-green-100">
            Tạo yêu cầu → Nhận báo giá → Chọn nhà cung cấp tốt nhất
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Nút tạo yêu cầu */}
        <div className="mb-8 text-right">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg flex items-center gap-2 transition-all"
          >
            <Plus className="w-5 h-5" />
            Tạo Yêu Cầu Mới
          </button>
        </div>

        {/* Danh sách yêu cầu */}
        <div className="grid gap-6">
          {requests.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow">
              <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Chưa có yêu cầu nào</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-green-600 font-medium hover:underline"
              >
                Tạo yêu cầu đầu tiên ngay!
              </button>
            </div>
          ) : (
            requests.map((req) => {
              const progress =
                selectedData?.request.MaYCDH === req.MaYCDH
                  ? selectedData
                  : null;
              const fulfilled = progress?.summary.progress.fulfilled || 0;
              const requested = req.SoLuongYeuCau;
              const percent = requested > 0 ? (fulfilled / requested) * 100 : 0;

              return (
                <div
                  key={req.MaYCDH}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl"
                >
                  {/* Header yêu cầu */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-2xl font-bold">
                          {req.TenSP_YeuCau}
                        </h3>
                        <div className="flex gap-4 mt-2 text-sm opacity-90">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" /> Hạn:{" "}
                            {new Date(req.ThoiHan).toLocaleDateString("vi-VN")}
                          </span>
                          {req.GiaMongMuon > 0 && (
                            <span>
                              Giá mong muốn: {req.GiaMongMuon.toLocaleString()}
                              đ/kg
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          req.TrangThai === "Open"
                            ? "bg-green-500"
                            : req.TrangThai === "Completed"
                            ? "bg-blue-700"
                            : req.TrangThai === "PartiallyFilled"
                            ? "bg-yellow-500"
                            : "bg-gray-500"
                        }`}
                      >
                        {req.TrangThai === "Open"
                          ? "Đang mở"
                          : req.TrangThai === "Completed"
                          ? "Hoàn thành"
                          : req.TrangThai === "PartiallyFilled"
                          ? "Đang xử lý"
                          : req.TrangThai}
                      </span>
                    </div>
                  </div>

                  {/* Tiến độ */}
                  <div className="p-6 border-b">
                    <div className="flex justify-between text-sm mb-2">
                      <span>
                        Cần: <strong>{requested} kg</strong>
                      </span>
                      <span>
                        Đã có:{" "}
                        <strong className="text-green-600">
                          {fulfilled} kg
                        </strong>
                      </span>
                      <span className="font-bold text-orange-600">
                        Còn thiếu: {requested - fulfilled} kg
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full transition-all duration-700"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Danh sách đề nghị */}
                  <div className="p-6">
                    <button
                      onClick={() => setSelectedRequest(req.MaYCDH)}
                      className="text-blue-600 font-medium hover:underline flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Xem {progress?.summary.total || 0} đề nghị từ nhà cung cấp
                    </button>

                    {selectedRequest === req.MaYCDH && selectedData && (
                      <div className="mt-6 grid gap-4">
                        {selectedData.proposals
                          .sort((a: any, b: any) => a.GiaDeNghi - b.GiaDeNghi)
                          .map((p: any) => (
                            <div
                              key={p.MaDNCC}
                              className="border rounded-xl p-5 hover:border-green-500 transition-all"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-lg">
                                    {p.MaTK_Seller_taikhoan?.HoTen}
                                  </h4>
                                  <p className="text-gray-600">
                                    {
                                      p.MaTK_Seller_taikhoan?.cuahangs?.[0]
                                        ?.TenCH
                                    }
                                  </p>
                                </div>
                                <span
                                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    p.TrangThai === "Accepted"
                                      ? "bg-green-100 text-green-800"
                                      : p.TrangThai === "Rejected"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {p.TrangThai === "Pending"
                                    ? "Đang chờ"
                                    : p.TrangThai === "Accepted"
                                    ? "Đã chọn"
                                    : "Bị từ chối"}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                                <div>
                                  <strong>Sản phẩm:</strong>{" "}
                                  {p.MaSP_sanpham?.TenSP}
                                </div>
                                <div>
                                  <strong>Số lượng:</strong> {p.SoLuongCungCap}{" "}
                                  kg
                                </div>
                                <div>
                                  <strong>Giá:</strong>{" "}
                                  <span className="text-green-600 font-bold">
                                    {p.GiaDeNghi.toLocaleString()}đ/kg
                                  </span>
                                </div>
                                <div>
                                  <strong>Tổng:</strong>{" "}
                                  <span className="font-bold text-lg text-blue-600">
                                    {(
                                      p.GiaDeNghi * p.SoLuongCungCap
                                    ).toLocaleString()}
                                    đ
                                  </span>
                                </div>
                              </div>

                              {p.ChatLuongDeNghi && (
                                <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                                  <strong>Chất lượng:</strong>{" "}
                                  {p.ChatLuongDeNghi}
                                </div>
                              )}

                              {p.TrangThai === "Pending" && (
                                <div className="mt-4 flex gap-3">
                                  <button
                                    onClick={() => handleAccept(p.MaDNCC)}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                                  >
                                    <CheckCircle className="w-5 h-5" /> Chấp
                                    Nhận
                                  </button>
                                  <button
                                    onClick={() => handleReject(p.MaDNCC)}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                                  >
                                    <XCircle className="w-5 h-5" /> Từ Chối
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal tạo yêu cầu */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold mb-6">
              Tạo Yêu Cầu Mua Hàng Mới
            </h2>
            <form onSubmit={handleCreate} className="space-y-5">
              <input
                type="text"
                placeholder="Tên sản phẩm (VD: Cà chua bi hữu cơ)"
                required
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                value={form.TenSP_YeuCau}
                onChange={(e) =>
                  setForm({ ...form, TenSP_YeuCau: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Số lượng cần (kg)"
                required
                min="1"
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                value={form.SoLuongYeuCau}
                onChange={(e) =>
                  setForm({ ...form, SoLuongYeuCau: +e.target.value })
                }
              />
              <textarea
                placeholder="Yêu cầu chất lượng (không bắt buộc)"
                rows={3}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                value={form.ChatLuongYeuCau}
                onChange={(e) =>
                  setForm({ ...form, ChatLuongYeuCau: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Giá mong muốn (VNĐ/kg) - không bắt buộc"
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                value={form.GiaMongMuon || ""}
                onChange={(e) =>
                  setForm({ ...form, GiaMongMuon: +e.target.value || 0 })
                }
              />

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl disabled:opacity-70"
                >
                  {creating ? "Đang tạo..." : "Tạo Yêu Cầu"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 rounded-xl"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
