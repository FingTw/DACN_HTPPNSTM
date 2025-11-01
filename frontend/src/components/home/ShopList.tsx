import React, { useEffect, useState } from "react";
import CuahangCard from "./CuahangCard";
import { cuahangService, type Cuahang } from "../../services/cuahangService";

const ShopList: React.FC = () => {
  const [stores, setStores] = useState<Cuahang[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        console.log("🔍 Fetching stores...");
        const data = await cuahangService.getAll({
          limit: 6, // Chỉ lấy 6 cửa hàng
          include: "MaHA_CuaHang_hinhanh,hdbanhang",
        });

        console.log("✅ API data:", data);

        if (Array.isArray(data)) {
          setStores(data);
        } else if (data && Array.isArray(data.cuahangs)) {
          setStores(data.cuahangs);
        } else {
          console.warn("⚠️ Dữ liệu trả về không đúng định dạng:", data);
          setStores([]);
        }
      } catch (err: any) {
        console.error("❌ Lỗi lấy danh sách cửa hàng:", err);
        setError("Không thể tải danh sách cửa hàng.");
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  if (loading)
    return (
      <div className="py-6">
        <div className="flex items-center space-x-3 mb-4 px-4">
          <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-800">Cửa Hàng Nông Sản</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <span className="text-emerald-600 text-sm ml-3">Đang tải...</span>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="py-6 px-4">
        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200">
          <span className="text-rose-600 text-sm">{error}</span>
        </div>
      </div>
    );

  if (!stores || stores.length === 0)
    return (
      <div className="py-6 px-4">
        <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
          <span className="text-gray-500 text-sm">Chưa có cửa hàng nào.</span>
        </div>
      </div>
    );

  return (
    <div className="py-6 bg-white rounded-2xl shadow-sm">
      {/* Header nhỏ gọn */}
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="flex items-center space-x-3">
          <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-800">Cửa Hàng Nông Sản</h2>
        </div>
        <a
          href="/cua-hang"
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Xem tất cả →
        </a>
      </div>

      {/* Grid nhỏ gọn 2-3 hàng */}
      <div className="px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
          {stores.map((store) => (
            <CuahangCard key={store.MaCH} store={store} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShopList;
