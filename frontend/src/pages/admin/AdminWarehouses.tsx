import React, { useEffect, useState } from "react";
import { adminService, type Warehouse } from "@/services/adminService";
import {
  Search,
  Plus,
  Trash2,
  Edit,
  X,
  Warehouse as WarehouseIcon,
  MapPin,
} from "lucide-react";

const AdminWarehouses = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWh, setEditingWh] = useState<any>(null);
  const [formData, setFormData] = useState({
    TenKho: "",
    DC: "",
    SucChua: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadWarehouses();
  }, [page, search]);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const data = await adminService.getWarehouses(page, 10, search);
      setWarehouses(data.warehouses);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Lỗi tải kho bãi:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (wh?: Warehouse) => {
    if (wh) {
      setEditingWh(wh);
      setFormData({
        TenKho: wh.TenKho,
        DC: wh.DC || "",
        SucChua: wh.SucChua || "",
      });
    } else {
      setEditingWh(null);
      setFormData({ TenKho: "", DC: "", SucChua: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingWh(null);
    setFormData({ TenKho: "", DC: "", SucChua: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.TenKho.trim() || !formData.DC.trim()) {
      alert("Vui lòng nhập tên kho và địa chỉ");
      return;
    }

    try {
      setSubmitting(true);
      if (editingWh) {
        await adminService.updateWarehouse(editingWh.MaKho, formData);
        alert("Cập nhật kho bãi thành công!");
      } else {
        await adminService.createWarehouse(formData);
        alert("Tạo kho bãi thành công!");
      }
      closeModal();
      setPage(1);
      loadWarehouses();
    } catch (error: any) {
      alert(error.message || "Lỗi khi lưu kho bãi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (MaKho: string) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa kho bãi này?")) return;

    try {
      await adminService.deleteWarehouse(MaKho);
      alert("Xóa kho bãi thành công!");
      loadWarehouses();
    } catch (error: any) {
      alert(error.message || "Lỗi khi xóa kho bãi");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <WarehouseIcon size={24} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Quản lý Kho Bãi
            </h1>
            <p className="text-sm text-gray-500">
              Quản lý tất cả kho bãi trong hệ thống
            </p>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          <Plus size={20} />
          Thêm Kho Bãi
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm kho bãi..."
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
        ) : warehouses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Không có kho bãi nào
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Mã Kho
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Tên Kho
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Địa Chỉ
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Sức Chứa
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    Hành Động
                  </th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map((wh) => (
                  <tr
                    key={wh.MaKho}
                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {wh.MaKho}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {wh.TenKho}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-gray-400" />
                        {wh.DC || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {wh.SucChua ? `${wh.SucChua} SP` : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(wh)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(wh.MaKho)}
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
                {editingWh ? "Cập Nhật Kho Bãi" : "Thêm Kho Bãi Mới"}
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
                  Tên Kho
                </label>
                <input
                  type="text"
                  value={formData.TenKho}
                  onChange={(e) =>
                    setFormData({ ...formData, TenKho: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Nhập tên kho"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa Chỉ
                </label>
                <input
                  type="text"
                  value={formData.DC}
                  onChange={(e) =>
                    setFormData({ ...formData, DC: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Nhập địa chỉ kho"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sức Chứa (số lượng sản phẩm)
                </label>
                <input
                  type="number"
                  value={formData.SucChua}
                  onChange={(e) =>
                    setFormData({ ...formData, SucChua: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Nhập sức chứa"
                  min="0"
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
                    : editingWh
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

export default AdminWarehouses;
