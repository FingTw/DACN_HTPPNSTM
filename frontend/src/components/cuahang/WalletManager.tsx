import React, { useState, useEffect } from "react";
import axios from "axios";

interface Transaction {
  MaGD: string;
  LoaiGD: string;
  SoTien: string;
  NoiDung: string;
  TrangThai: string;
  NgayTao: string;
}

interface WalletManagerProps {
  storeId: string;
}

const WalletManager: React.FC<WalletManagerProps> = ({ storeId }) => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);

  // Form state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:3000/api/wallet/${storeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        setBalance(parseFloat(response.data.data.balance));
        setTransactions(response.data.data.transactions);
      }
    } catch (error) {
      console.error("Lỗi tải ví:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [storeId]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:3000/api/wallet/withdraw`,
        {
          MaCH: storeId,
          SoTien: parseFloat(withdrawAmount),
          TenNganHang: bankName,
          SoTaiKhoan: accountNumber,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert("✅ Gửi yêu cầu rút tiền thành công!");
        setShowWithdrawForm(false);
        setWithdrawAmount("");
        fetchWalletData(); // Refresh data
      }
    } catch (error: any) {
      alert(
        "❌ Lỗi: " + (error.response?.data?.message || "Không thể rút tiền")
      );
    }
  };

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(amount));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ThanhCong":
        return "bg-green-100 text-green-800";
      case "DangXuLy":
        return "bg-yellow-100 text-yellow-800";
      case "TuChoi":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) return <div>Đang tải dữ liệu ví...</div>;

  return (
    <div className="space-y-6">
      {/* Thẻ Số Dư */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-emerald-100 text-lg font-medium mb-1">
            Số dư khả dụng
          </h2>
          <div className="text-4xl font-bold mb-6">
            {formatCurrency(balance)}
          </div>

          <button
            onClick={() => setShowWithdrawForm(true)}
            className="bg-white text-emerald-600 px-6 py-2 rounded-full font-bold hover:bg-emerald-50 transition shadow-md flex items-center gap-2"
          >
            <span>💸</span> Yêu cầu rút tiền
          </button>
        </div>

        {/* Decorative circle */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      {/* Form Rút Tiền (Modal hoặc Inline) */}
      {showWithdrawForm && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-fade-in-down">
          <h3 className="text-xl font-bold mb-4 text-gray-800">
            Tạo yêu cầu rút tiền
          </h3>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số tiền muốn rút (VNĐ)
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                placeholder="Ví dụ: 500000"
                min="50000"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Tối thiểu 50.000đ</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên ngân hàng
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                  placeholder="MBBank, Vietcombank..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số tài khoản
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                  placeholder="Số tài khoản nhận tiền"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium"
              >
                Gửi yêu cầu
              </button>
              <button
                type="button"
                onClick={() => setShowWithdrawForm(false)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium"
              >
                Hủy bỏ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lịch sử giao dịch */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800">Lịch sử giao dịch</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Mã GD</th>
                <th className="px-6 py-3 text-left">Loại</th>
                <th className="px-6 py-3 text-left">Số tiền</th>
                <th className="px-6 py-3 text-left">Nội dung</th>
                <th className="px-6 py-3 text-left">Trạng thái</th>
                <th className="px-6 py-3 text-left">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    Chưa có giao dịch nào
                  </td>
                </tr>
              ) : (
                transactions.map((gd) => (
                  <tr key={gd.MaGD} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs">{gd.MaGD}</td>
                    <td className="px-6 py-4">
                      {gd.LoaiGD === "NHAN_TIEN_DON_HANG" ? (
                        <span className="text-green-600 font-medium">
                          ⬇️ Nhận tiền
                        </span>
                      ) : (
                        <span className="text-orange-600 font-medium">
                          ⬆️ Rút tiền
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-6 py-4 font-bold ${
                        gd.LoaiGD === "NHAN_TIEN_DON_HANG" ||
                        gd.LoaiGD === "HOAN_TIEN_RUT"
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {gd.LoaiGD === "RUT_TIEN" ? "-" : "+"}
                      {formatCurrency(gd.SoTien)}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate"
                      title={gd.NoiDung}
                    >
                      {gd.NoiDung}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          gd.TrangThai
                        )}`}
                      >
                        {gd.TrangThai === "ThanhCong"
                          ? "Thành công"
                          : gd.TrangThai === "DangXuLy"
                          ? "Chờ duyệt"
                          : "Đã hủy/Từ chối"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(gd.NgayTao).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WalletManager;
