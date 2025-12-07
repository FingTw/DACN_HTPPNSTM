import React, { useEffect, useState } from "react";
import {
  adminService,
  type User,
  type Employee,
  type Department,
  type Position,
} from "@/services/adminService";
import {
  Search,
  Link2,
  CheckCircle,
  XCircle,
  Users,
  AlertCircle,
} from "lucide-react";

interface AccountEmployee {
  user: User;
  employee?: Employee;
  isLinked: boolean;
}

const AdminAccountAssignment = () => {
  const [accounts, setAccounts] = useState<AccountEmployee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    MaPB: "",
    MaCV: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [page, search]);

  const loadInitialData = async () => {
    try {
      // Load departments và positions
      const depts = await adminService.getDepartments(1, 100, "");
      const poss = await adminService.getPositions(1, 100, "");
      setDepartments(depts.departments);
      setPositions(poss.positions);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    }
  };

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const usersData = await adminService.getUsers(page, 10, search);

      // Lấy danh sách nhân viên để matching
      const empData = await adminService.getEmployees(1, 100, "");
      const employeeMap = new Map(empData.employees.map((e) => [e.MaNV, e]));

      // Kết hợp user với employee info
      const combined: AccountEmployee[] = usersData.users.map((user) => ({
        user,
        employee: employeeMap.get(user.MaTK),
        isLinked: employeeMap.has(user.MaTK),
      }));

      setAccounts(combined);
      setTotalPages(usersData.total ? Math.ceil(usersData.total / 10) : 1);
    } catch (error) {
      console.error("Lỗi tải tài khoản:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (account: AccountEmployee) => {
    setSelectedUser(account);
    if (account.employee) {
      setFormData({
        MaPB: account.employee.MaPB || "",
        MaCV: account.employee.MaCV || "",
      });
    } else {
      setFormData({ MaPB: "", MaCV: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setFormData({ MaPB: "", MaCV: "" });
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!formData.MaPB || !formData.MaCV) {
      alert("Vui lòng chọn phòng ban và chức vụ");
      return;
    }

    try {
      setSubmitting(true);

      if (selectedUser.isLinked) {
        // Update existing employee info
        await adminService.updateEmployee(selectedUser.user.MaTK, {
          HoTen: selectedUser.user.HoTen,
          Email: selectedUser.user.Email,
          SDT: selectedUser.user.SDT,
          MaPB: formData.MaPB,
          MaCV: formData.MaCV,
        });
        alert("Cập nhật thông tin nhân viên thành công!");
      } else {
        // Create new employee record
        await adminService.updateEmployee(selectedUser.user.MaTK, {
          HoTen: selectedUser.user.HoTen,
          Email: selectedUser.user.Email,
          SDT: selectedUser.user.SDT,
          MaPB: formData.MaPB,
          MaCV: formData.MaCV,
        });
        alert("Gán tài khoản cho nhân viên thành công!");
      }

      closeModal();
      loadAccounts();
    } catch (error: any) {
      alert(error.message || "Lỗi khi gán tài khoản");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-lg">
            <Link2 size={24} className="text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Gán Tài Khoản cho Nhân Viên
            </h1>
            <p className="text-sm text-gray-500">
              Liên kết tài khoản người dùng với thông tin nhân viên
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
        <div>
          <p className="font-medium text-blue-900">Cách hoạt động:</p>
          <p className="text-sm text-blue-800">
            Tài khoản được gán cho nhân viên sẽ được ghi nhận trong hệ thống
            quản lý nhân sự. Bạn có thể gán phòng ban và chức vụ cho từng tài
            khoản.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tài khoản..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="bg-transparent outline-none flex-1"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : accounts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Không có tài khoản nào
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Tài Khoản
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Tên Đăng Nhập
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Phòng Ban
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Chức Vụ
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Trạng Thái
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    Hành Động
                  </th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr
                    key={account.user.MaTK}
                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                          {account.user.HoTen?.charAt(0) || "?"}
                        </div>
                        <span className="text-sm font-mono text-gray-600">
                          {account.user.MaTK}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {account.user.TenDangNhap}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {account.user.Email || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {account.employee?.MaPB_phongban?.TenPB || (
                        <span className="text-gray-400">Chưa gán</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {account.employee?.MaCV_chucvu?.TenCV || (
                        <span className="text-gray-400">Chưa gán</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {account.isLinked ? (
                        <div className="flex items-center justify-center gap-1 text-green-600">
                          <CheckCircle size={16} />
                          <span className="text-xs font-medium">Đã gán</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1 text-yellow-600">
                          <AlertCircle size={16} />
                          <span className="text-xs font-medium">Chưa gán</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openModal(account)}
                        className="px-3 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 transition"
                      >
                        {account.isLinked ? "Cập Nhật" : "Gán Ngay"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Trang {page} / {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 transition"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 transition"
                >
                  Tiếp
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white">
              <h2 className="text-lg font-bold">Gán Tài Khoản cho Nhân Viên</h2>
              <p className="text-sm text-emerald-100">
                {selectedUser.user.HoTen}
              </p>
            </div>

            <form onSubmit={handleAssign} className="p-6 space-y-4">
              {/* Display Account Info */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div>
                  <p className="text-xs text-gray-600">Mã TK:</p>
                  <p className="text-sm font-mono font-semibold text-gray-800">
                    {selectedUser.user.MaTK}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Tên Đăng Nhập:</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {selectedUser.user.TenDangNhap}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Email:</p>
                  <p className="text-sm text-gray-800">
                    {selectedUser.user.Email}
                  </p>
                </div>
              </div>

              {/* Phòng Ban */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phòng Ban *
                </label>
                <select
                  value={formData.MaPB}
                  onChange={(e) =>
                    setFormData({ ...formData, MaPB: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="">-- Chọn Phòng Ban --</option>
                  {departments.map((dept) => (
                    <option key={dept.MaPB} value={dept.MaPB}>
                      {dept.TenPB}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chức Vụ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chức Vụ *
                </label>
                <select
                  value={formData.MaCV}
                  onChange={(e) =>
                    setFormData({ ...formData, MaCV: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="">-- Chọn Chức Vụ --</option>
                  {positions.map((pos) => (
                    <option key={pos.MaCV} value={pos.MaCV}>
                      {pos.TenCV}
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Assignment Info */}
              {selectedUser.isLinked && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs">
                  <p className="text-blue-900">
                    <strong>Thông tin hiện tại:</strong>
                  </p>
                  <p className="text-blue-800">
                    Phòng Ban:{" "}
                    {selectedUser.employee?.MaPB_phongban?.TenPB || "Chưa có"}
                  </p>
                  <p className="text-blue-800">
                    Chức Vụ:{" "}
                    {selectedUser.employee?.MaCV_chucvu?.TenCV || "Chưa có"}
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition flex items-center gap-2"
                >
                  <Link2 size={16} />
                  {submitting
                    ? "Đang xử lý..."
                    : selectedUser.isLinked
                    ? "Cập Nhật"
                    : "Gán Ngay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAccountAssignment;
