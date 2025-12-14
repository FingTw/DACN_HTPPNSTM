import React, { useEffect, useState } from "react";
import {
  Search,
  Edit,
  Trash2,
  Plus,
  Box,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { adminService, type AdminProduct } from "@/services/adminService";
import { toast } from "sonner";

const AdminProducts = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(false);

  // State phân trang & tìm kiếm
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search để không gọi API liên tục khi gõ
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Gọi API lấy dữ liệu
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await adminService.getProducts(page, 100, debouncedSearch);
      setProducts(data.products);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, debouncedSearch]);

  // Xử lý xóa (Demo)
  const handleDelete = async (maSP: string) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    try {
      // await adminService.deleteProduct(maSP);
      toast.success("Đã xóa sản phẩm (Demo)");
      fetchProducts();
    } catch (error) {
      toast.error("Lỗi khi xóa");
    }
  };

  // Hàm helper xử lý ảnh
  const getImageUrl = (url?: string) => {
    if (!url) return "https://via.placeholder.com/150";
    if (url.startsWith("http")) return url;
    return `http://localhost:3000${url.startsWith("/") ? url : `/${url}`}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Sản phẩm</h2>
        {/* <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition">
          <Plus size={20} /> Thêm mới
        </button> */}
        {/* Admin thường chỉ quản lý, ít khi thêm sản phẩm thay shop */}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Thanh tìm kiếm */}
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative max-w-md flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }} // Reset về trang 1 khi tìm
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Bảng dữ liệu */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 flex justify-center text-emerald-600">
              <Loader2 className="animate-spin w-8 h-8" />
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Sản phẩm</th>
                  <th className="px-6 py-4">Cửa hàng</th>
                  <th className="px-6 py-4">Giá bán</th>
                  <th className="px-6 py-4">Tồn kho</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-gray-500">
                      Không tìm thấy sản phẩm nào
                    </td>
                  </tr>
                ) : (
                  products.map((sp) => (
                    <tr
                      key={sp.MaSP}
                      className="hover:bg-gray-50/50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                            {sp.hinhanhs && sp.hinhanhs.length > 0 ? (
                              <img
                                src={getImageUrl(sp.hinhanhs[0].URL)}
                                alt={sp.TenSP}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <Box size={20} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p
                              className="font-medium text-gray-900 line-clamp-1 max-w-[200px]"
                              title={sp.TenSP}
                            >
                              {sp.TenSP}
                            </p>
                            <p className="text-xs text-gray-500">{sp.MaSP}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {sp.cuahang?.TenCH || (
                          <span className="text-gray-400 italic">Không rõ</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-emerald-600">
                        {sp.GiaBan.toLocaleString()} ₫
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            sp.SLTon > 10
                              ? "bg-blue-100 text-blue-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {sp.SLTon}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            sp.TrangThai === "Đang bán"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {sp.TrangThai}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        {/* <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                        <Edit size={18} />
                      </button> */}
                        <button
                          onClick={() => handleDelete(sp.MaSP)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Phân trang */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Trang {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              // Đảm bảo không bao giờ set page < 1
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading} // Sửa điều kiện disable
              className="..."
            >
              <ChevronLeft size={18} />
            </button>

            <span className="px-4 py-2">
              Trang {page} / {totalPages || 1}{" "}
              {/* Fallback nếu totalPages lỗi */}
            </span>

            <button
              // Đảm bảo không set page vượt quá totalPages
              onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
              disabled={page >= totalPages || loading} // Sửa điều kiện disable
              className="..."
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
