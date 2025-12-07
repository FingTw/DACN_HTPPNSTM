import React, { useEffect, useState } from "react";
import { adminService, type Department } from "@/services/adminService";
import { Search, Plus, Trash2, Edit, X, Building2 } from "lucide-react";

const AdminDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [formData, setFormData] = useState({
    TenPB: "",
    MoTa: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, [page, search]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDepartments(page, 10, search);
      setDepartments(data.departments);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Lỗi tải phòng ban:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({
        TenPB: dept.TenPB,
        MoTa: dept.MoTa || "",
      });
    } else {
      setEditingDept(null);
      setFormData({ TenPB: "", MoTa: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDept(null);
    setFormData({ TenPB: "", MoTa: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.TenPB.trim()) {
      alert("Vui lòng nhập tên phòng ban");
      return;
    }

    try {
      setSubmitting(true);
      if (editingDept) {
        await adminService.updateDepartment(editingDept.MaPB, formData);
        alert("Cập nhật phòng ban thành công!");
      } else {
        await adminService.createDepartment(formData);
        alert("Tạo phòng ban thành công!");
      }
      closeModal();
      setPage(1);
      loadDepartments();
    } catch (error: any) {
      alert(error.message || "Lỗi khi lưu phòng ban");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (MaPB: string) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa phòng ban này?")) return;

    try {
      await adminService.deleteDepartment(MaPB);
      alert("Xóa phòng ban thành công!");
      loadDepartments();
    } catch (error: any) {
      alert(error.message || "Lỗi khi xóa phòng ban");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Building2 size={24} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Quản lý Phòng Ban
            </h1>
            <p className="text-sm text-gray-500">
              Quản lý tất cả phòng ban trong hệ thống
            </p>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          <Plus size={20} />
          Thêm Phòng Ban
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm phòng ban..."
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
        ) : departments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Không có phòng ban nào
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Mã PB
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Tên Phòng Ban
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Mô Tả
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    Hành Động
                  </th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr
                    key={dept.MaPB}
                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {dept.MaPB}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {dept.TenPB}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {dept.MoTa || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(dept)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(dept.MaPB)}
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
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">
                {editingDept ? "Cập Nhật Phòng Ban" : "Thêm Phòng Ban Mới"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên Phòng Ban
                </label>
                <input
                  type="text"
                  value={formData.TenPB}
                  onChange={(e) =>
                    setFormData({ ...formData, TenPB: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Nhập tên phòng ban"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô Tả
                </label>
                <textarea
                  value={formData.MoTa}
                  onChange={(e) =>
                    setFormData({ ...formData, MoTa: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
                  placeholder="Nhập mô tả"
                  rows={3}
                />
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
                  {submitting
                    ? "Đang lưu..."
                    : editingDept
                    ? "Cập Nhật"
                    : "Tạo Mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDepartments;
