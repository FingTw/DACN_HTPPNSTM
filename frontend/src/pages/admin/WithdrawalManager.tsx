import React, { useState, useEffect } from "react";
import { adminService, type WithdrawalRequest } from "@/services/adminService";
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Building2,
  User,
} from "lucide-react";
import { toast } from "sonner";

const WithdrawalManager: React.FC = () => {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("DangXuLy"); // DangXuLy | History

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Nếu filter là History thì lấy tất cả trừ DangXuLy (hoặc xử lý lọc ở client)
      // Ở đây mình lấy hết rồi lọc client cho đơn giản
      const data = await adminService.getWithdrawals();
      if (filter === "DangXuLy") {
        setRequests(data.filter((r) => r.TrangThai === "DangXuLy"));
      } else {
        setRequests(data.filter((r) => r.TrangThai !== "DangXuLy"));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (MaGD: string, Action: "APPROVE" | "REJECT") => {
    const reason = Action === "REJECT" ? prompt("Nhập lý do từ chối:") : "";
    if (Action === "REJECT" && !reason) return;

    if (
      !confirm(
        `Bạn chắc chắn muốn ${
          Action === "APPROVE" ? "DUYỆT" : "TỪ CHỐI"
        } giao dịch này?`
      )
    )
      return;

    try {
      await adminService.handleWithdrawal({
        MaGD,
        Action,
        GhiChuAdmin: reason || "",
      });
      toast.success("Xử lý thành công!");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi xử lý");
    }
  };

  const formatCurrency = (val: string | number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(val));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Rút tiền</h1>
        <div className="flex bg-white p-1 rounded-lg border border-gray-200">
          <button
            onClick={() => setFilter("DangXuLy")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              filter === "DangXuLy"
                ? "bg-emerald-100 text-emerald-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Chờ xử lý
          </button>
          <button
            onClick={() => setFilter("History")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              filter === "History"
                ? "bg-emerald-100 text-emerald-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Lịch sử
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Đang tải dữ liệu...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center">
            <Search size={48} className="mb-2 opacity-20" />
            <p>Không có yêu cầu nào</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Mã GD / Ngày</th>
                <th className="px-6 py-4">Cửa hàng</th>
                <th className="px-6 py-4">Thông tin ngân hàng</th>
                <th className="px-6 py-4 text-right">Số tiền</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                {filter === "DangXuLy" && (
                  <th className="px-6 py-4 text-right">Hành động</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {requests.map((req) => (
                <tr
                  key={req.MaGD}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-mono font-bold text-gray-700">
                      {req.MaGD}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {new Date(req.NgayTao).toLocaleString("vi-VN")}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Building2 size={16} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">
                          {req.cuahang?.TenCH}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <User size={10} /> {req.cuahang?.MaTK_taikhoan?.HoTen}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">
                      {req.TenNganHang}
                    </div>
                    <div className="font-mono text-gray-500">
                      {req.SoTaiKhoan}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-600 text-base">
                    {formatCurrency(req.SoTien)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {req.TrangThai === "DangXuLy" && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                        Chờ duyệt
                      </span>
                    )}
                    {req.TrangThai === "ThanhCong" && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                        Thành công
                      </span>
                    )}
                    {req.TrangThai === "TuChoi" && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                        Từ chối
                      </span>
                    )}
                  </td>
                  {filter === "DangXuLy" && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleAction(req.MaGD, "APPROVE")}
                          className="p-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-colors tooltip"
                          title="Duyệt"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => handleAction(req.MaGD, "REJECT")}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors tooltip"
                          title="Từ chối"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default WithdrawalManager;
