import React, { useEffect, useState } from "react";
import { adminService, type Position } from "@/services/adminService";
import { Search, Plus, Trash2, Edit, X, Briefcase } from "lucide-react";

const AdminPositions = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<any>(null);
  const [formData, setFormData] = useState({
    TenCV: "",
    MoTa: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPositions();
  }, [page, search]);

  const loadPositions = async () => {
    try {
      setLoading(true);
      const data = await adminService.getPositions(page, 10, search);
      setPositions(data.positions);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Lỗi tải chức vụ:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (pos?: Position) => {
    if (pos) {
      setEditingPos(pos);
      setFormData({
        TenCV: pos.TenCV,
        MoTa: pos.MoTa || "",
      });
    } else {
      setEditingPos(null);
      setFormData({ TenCV: "", MoTa: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPos(null);
    setFormData({ TenCV: "", MoTa: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.TenCV.trim()) {
      alert("Vui lòng nhập tên chức vụ");
      return;
    }

    try {
      setSubmitting(true);
      if (editingPos) {
        await adminService.updatePosition(editingPos.MaCV, formData);
        alert("Cập nhật chức vụ thành công!");
      } else {
        await adminService.createPosition(formData);
        alert("Tạo chức vụ thành công!");
      }
      closeModal();
      setPage(1);
      loadPositions();
    } catch (error: any) {
      alert(error.message || "Lỗi khi lưu chức vụ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (MaCV: string) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa chức vụ này?")) return;

    try {
      await adminService.deletePosition(MaCV);
      alert("Xóa chức vụ thành công!");
      loadPositions();
    } catch (error: any) {
      alert(error.message || "Lỗi khi xóa chức vụ");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Briefcase size={24} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Quản lý Chức Vụ
            </h1>
            <p className="text-sm text-gray-500">
              Quản lý tất cả chức vụ trong hệ thống
            </p>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          <Plus size={20} />
          Thêm Chức Vụ
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm chức vụ..."
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
        ) : positions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Không có chức vụ nào
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Mã CV
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Tên Chức Vụ
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
                {positions.map((pos) => (
                  <tr
                    key={pos.MaCV}
                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {pos.MaCV}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {pos.TenCV}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {pos.MoTa || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(pos)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(pos.MaCV)}
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
                {editingPos ? "Cập Nhật Chức Vụ" : "Thêm Chức Vụ Mới"}
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
                  Tên Chức Vụ
                </label>
                <input
                  type="text"
                  value={formData.TenCV}
                  onChange={(e) =>
                    setFormData({ ...formData, TenCV: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Nhập tên chức vụ"
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
                    : editingPos
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

export default AdminPositions;
