// components/cuahang/CuahangDetail.tsx
import React from "react";

interface Store {
  MaCH: string;
  TenCH: string;
  SLTheoDoi: number;
  DiemDG: number;
  DCLayHang?: string;
  NgayTao?: string;
  MoTa?: string;
  MaTK: string;
  MaHA_CuaHang_hinhanh?: {
    URL: string;
  };
  hdbanhang?: {
    LoaiHinhKD: string;
  };
}

interface CuahangDetailProps {
  store: Store;
  isOwner?: boolean;
  onEdit?: () => void;
}

const CuahangDetail: React.FC<CuahangDetailProps> = ({
  store,
  isOwner = false,
  onEdit,
}) => {
  console.log("🏪 CuahangDetail RENDER - store:", store);

  // Tính năm hoạt động
  const yearsActive = store.NgayTao
    ? new Date().getFullYear() - new Date(store.NgayTao).getFullYear()
    : 1;

  // Xử lý hình ảnh
  const imageUrl = store.MaHA_CuaHang_hinhanh?.URL || "/logoshopdefault.jpg";

  return (
    <div className="bg-gradient-to-br from-white to-emerald-50 rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* Ảnh cửa hàng với design mới */}
        <div className="lg:w-2/5 p-8">
          <div className="relative group">
            <div className="w-full h-80 bg-gradient-to-br from-emerald-500/10 to-lime-500/10 rounded-3xl shadow-inner border border-emerald-200 overflow-hidden">
              <img
                src={imageUrl}
                alt={store.TenCH}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/logoshopdefault.jpg";
                }}
              />
            </div>
            {/* Badge uy tín */}
            <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
              🏆 Uy tín {yearsActive}+ năm
            </div>

            {/* Badge loại hình kinh doanh */}
            {store.hdbanhang?.LoaiHinhKD && (
              <div className="absolute bottom-4 left-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                🏢 {store.hdbanhang.LoaiHinhKD}
              </div>
            )}
          </div>
        </div>

        {/* Thông tin chi tiết */}
        <div className="flex-1 p-8 lg:border-l border-emerald-100">
          {/* Thêm nút chỉnh sửa cho chủ cửa hàng */}
          {isOwner && (
            <div className="flex justify-end mb-4">
              <button
                onClick={onEdit}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
              >
                ✏️ Chỉnh sửa
              </button>
            </div>
          )}

          <div className="mb-6">
            <div className="inline-flex items-center bg-emerald-500/10 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
              🚜 Cửa hàng nông sản chính hiệu
            </div>

            <h1 className="text-4xl font-bold text-gray-800 mb-3">
              {store.TenCH}
            </h1>

            <p className="text-lg text-gray-600 mb-6">
              {store.MoTa ||
                "Chuyên cung cấp nông sản sạch, an toàn và chất lượng. Cam kết mang đến sản phẩm tươi ngon nhất từ vườn đến tay người tiêu dùng."}
            </p>
          </div>

          {/* Thông tin chi tiết */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <span className="text-lg">🏷️</span>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Mã cửa hàng</div>
                  <div className="font-semibold text-gray-800">
                    {store.MaCH}
                  </div>
                </div>
              </div>

              {store.DCLayHang && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <span className="text-lg">📍</span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">
                      Địa chỉ lấy hàng
                    </div>
                    <div className="font-semibold text-gray-800">
                      {store.DCLayHang}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <span className="text-lg">❤️</span>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Người theo dõi</div>
                  <div className="font-semibold text-gray-800">
                    {store.SLTheoDoi?.toLocaleString() || 0}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <span className="text-lg">⭐</span>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Điểm đánh giá</div>
                  <div className="font-semibold text-gray-800 flex items-center gap-2">
                    {store.DiemDG?.toFixed(1) || "0.0"}
                    <span className="text-amber-500">★★★★★</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button className="bg-gradient-to-r from-emerald-500 to-lime-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105">
              📞 Liên hệ ngay
            </button>
            <button className="bg-white text-gray-700 px-6 py-3 rounded-xl font-semibold border border-gray-300 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200">
              ❤️ Theo dõi
            </button>
            <button className="bg-white text-gray-700 px-6 py-3 rounded-xl font-semibold border border-gray-300 hover:border-amber-300 hover:bg-amber-50 transition-all duration-200">
              🔔 Nhận thông báo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CuahangDetail;
