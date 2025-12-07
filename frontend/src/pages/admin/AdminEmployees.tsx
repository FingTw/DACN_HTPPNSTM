import React, { useEffect, useState } from "react";
import {
  adminService,
  type Employee,
  type Department,
  type Position,
} from "@/services/adminService";
import { Search, Trash2, Edit, X, Users, Mail, Phone } from "lucide-react";

const AdminEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<any>(null);
  const [formData, setFormData] = useState({
    HoTen: "",
    SDT: "",
    Email: "",
    MaPB: "",
    MaCV: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadEmployees();
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

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await adminService.getEmployees(page, 10, search);
      setEmployees(data.employees);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Lỗi tải nhân viên:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (emp?: Employee) => {
    if (emp) {
      setEditingEmp(emp);
      setFormData({
        HoTen: emp.HoTen,
        SDT: emp.SDT || "",
        Email: emp.Email || "",
        MaPB: emp.MaPB || "",
        MaCV: emp.MaCV || "",
      });
    } else {
      setEditingEmp(null);
      setFormData({
        HoTen: "",
        SDT: "",
        Email: "",
        MaPB: "",
        MaCV: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmp(null);
    setFormData({
      HoTen: "",
      SDT: "",
      Email: "",
      MaPB: "",
      MaCV: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.HoTen.trim()) {
      alert("Vui lòng nhập tên nhân viên");
      return;
    }

    try {
      setSubmitting(true);
      await adminService.updateEmployee(editingEmp.MaNV, formData);
      alert("Cập nhật thông tin nhân viên thành công!");
      closeModal();
      loadEmployees();
    } catch (error: any) {
      alert(error.message || "Lỗi khi lưu thông tin");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (MaNV: string) => {
    if (
      !window.confirm(
        "Bạn chắc chắn muốn xóa nhân viên này? Tài khoản cũng sẽ bị xóa!"
      )
    )
      return;

    try {
      await adminService.deleteUser(MaNV);
      alert("Xóa nhân viên thành công!");
      loadEmployees();
    } catch (error: any) {
      alert(error.message || "Lỗi khi xóa nhân viên");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-100 rounded-lg">
            <Users size={24} className="text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Quản lý Nhân Viên
            </h1>
            <p className="text-sm text-gray-500">
              Quản lý thông tin nhân viên, phòng ban và chức vụ
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nhân viên..."
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
        ) : employees.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Không có nhân viên nào
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Mã NV
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Tên Nhân Viên
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    SĐT
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Phòng Ban
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Chức Vụ
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    Hành Động
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr
                    key={emp.MaNV}
                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {emp.MaNV}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {emp.HoTen}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail size={14} className="text-gray-400" />
                        {emp.Email || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Phone size={14} className="text-gray-400" />
                        {emp.SDT || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {emp.MaPB_phongban?.TenPB || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {emp.MaCV_chucvu?.TenCV || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(emp)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.MaNV)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
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
      {isModalOpen && editingEmp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">
                Cập Nhật Thông Tin Nhân Viên
              </h2>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4 max-h-96 overflow-y-auto"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên Nhân Viên
                </label>
                <input
                  type="text"
                  value={formData.HoTen}
                  onChange={(e) =>
                    setFormData({ ...formData, HoTen: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Nhập tên"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.Email}
                  onChange={(e) =>
                    setFormData({ ...formData, Email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Nhập email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số Điện Thoại
                </label>
                <input
                  type="tel"
                  value={formData.SDT}
                  onChange={(e) =>
                    setFormData({ ...formData, SDT: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Nhập SĐT"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phòng Ban
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chức Vụ
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

              <div className="flex gap-3 justify-end pt-4">
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
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {submitting ? "Đang lưu..." : "Cập Nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmployees;
