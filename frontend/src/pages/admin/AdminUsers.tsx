import React, { useEffect, useState } from "react";
import {
  adminService,
  type User,
  type Role,
  type Position,
} from "@/services/adminService";
import {
  Search,
  MoreVertical,
  User as UserIcon,
  X,
  Plus,
  Trash2,
  Edit,
} from "lucide-react";

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null); // User đang edit
  const [formData, setFormData] = useState({
    TenDangNhap: "",
    MatKhau: "",
    HoTen: "",
    Email: "",
    Roles: [] as string[], // Mảng MaVT
    MaCV: "", // Chức vụ
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [search]);

  const loadInitialData = async () => {
    try {
      const meta = await adminService.getMetaData();
      setRoles(meta.roles);
      setPositions(meta.positions);
    } catch (e) {
      console.error(e);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    const data = await adminService.getUsers(1, 20, search);
    setUsers(data.users || []);
    setLoading(false);
  };

  // Mở modal tạo mới
  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      TenDangNhap: "",
      MatKhau: "",
      HoTen: "",
      Email: "",
      Roles: [],
      MaCV: "",
    });
    setIsModalOpen(true);
  };

  // Mở modal edit
  const handleOpenEdit = async (user: User) => {
    try {
      // Gọi API lấy chi tiết user để có danh sách Roles hiện tại và MaCV
      const detail = await adminService.getUserDetail(user.MaTK);
      setEditingUser(detail);
      setFormData({
        TenDangNhap: detail.TenDangNhap,
        MatKhau: "", // Không hiển thị mật khẩu cũ
        HoTen: detail.HoTen,
        Email: detail.Email,
        Roles: detail.Roles || [], // Mảng các mã vai trò
        MaCV: detail.EmployeeInfo?.MaCV || "",
      });
      setIsModalOpen(true);
    } catch (error) {
      alert("Lỗi tải thông tin user");
    }
  };

  const handleDelete = async (MaTK: string) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa user này?")) return;
    await adminService.deleteUser(MaTK);
    loadUsers();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await adminService.updateUserFull(editingUser.MaTK, formData);
        alert("Cập nhật thành công!");
      } else {
        await adminService.createUser(formData);
        alert("Tạo mới thành công!");
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  // Xử lý tick chọn Roles
  const handleRoleChange = (maVT: string) => {
    setFormData((prev) => {
      const exists = prev.Roles.includes(maVT);
      if (exists)
        return { ...prev, Roles: prev.Roles.filter((r) => r !== maVT) };
      return { ...prev, Roles: [...prev.Roles, maVT] };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý người dùng</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="px-4 py-2 border rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={handleOpenCreate}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-700"
          >
            <Plus size={18} /> Thêm User
          </button>
        </div>
      </div>

      {/* TABLE USERS (Giữ nguyên cấu trúc cũ, thêm nút Action) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          {/* ... THEAD giữ nguyên ... */}
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.MaTK} className="hover:bg-gray-50/50">
                {/* ... Cột User info giữ nguyên ... */}
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold">{user.TenDangNhap}</span>
                    <span className="text-xs text-gray-500">{user.Email}</span>
                  </div>
                </td>

                <td className="px-6 py-4">
                  {/* Hiển thị role sơ bộ */}
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {user.Role || "N/A"}
                  </span>
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(user)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(user.MaTK)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[600px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h3 className="text-xl font-bold">
                {editingUser ? "Cập nhật User" : "Thêm mới User"}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tên đăng nhập
                  </label>
                  <input
                    disabled={!!editingUser}
                    type="text"
                    className="w-full border p-2 rounded"
                    value={formData.TenDangNhap}
                    onChange={(e) =>
                      setFormData({ ...formData, TenDangNhap: e.target.value })
                    }
                  />
                </div>
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Mật khẩu
                    </label>
                    <input
                      type="password"
                      className="w-full border p-2 rounded"
                      value={formData.MatKhau}
                      onChange={(e) =>
                        setFormData({ ...formData, MatKhau: e.target.value })
                      }
                    />
                  </div>
                )}
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Họ tên
                  </label>
                  <input
                    type="text"
                    className="w-full border p-2 rounded"
                    value={formData.HoTen}
                    onChange={(e) =>
                      setFormData({ ...formData, HoTen: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full border p-2 rounded"
                    value={formData.Email}
                    onChange={(e) =>
                      setFormData({ ...formData, Email: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* PHẦN CHỌN VAI TRÒ (Checkbox) */}
              <div className="border-t pt-4">
                <label className="block text-sm font-bold mb-2">
                  Vai trò (Roles)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map((role) => (
                    <label
                      key={role.MaVT}
                      className="flex items-center space-x-2 cursor-pointer border p-2 rounded hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={formData.Roles.includes(role.MaVT)}
                        onChange={() => handleRoleChange(role.MaVT)}
                        className="rounded text-emerald-600"
                      />
                      <span className="text-sm">{role.TenVT}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* PHẦN QUẢN LÝ NHÂN VIÊN (Chỉ hiện khi có role liên quan đến nhân viên hoặc luôn hiện tùy logic) */}
              <div className="border-t pt-4 bg-gray-50 p-4 rounded-xl">
                <label className="block text-sm font-bold mb-2 text-emerald-800">
                  Cấu hình nhân viên
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Chọn chức vụ nếu tài khoản này là nhân viên.
                </p>

                <select
                  className="w-full border p-2 rounded"
                  value={formData.MaCV}
                  onChange={(e) =>
                    setFormData({ ...formData, MaCV: e.target.value })
                  }
                >
                  <option value="">
                    -- Không phải nhân viên / Chưa có chức vụ --
                  </option>
                  {positions.map((pos) => (
                    <option key={pos.MaCV} value={pos.MaCV}>
                      {pos.TenCV} (User sẽ được thêm vào bảng NV)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
