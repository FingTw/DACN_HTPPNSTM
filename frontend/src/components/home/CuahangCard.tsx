// components/home/CuahangCard.tsx
import React from "react";
import { Link } from "react-router-dom";
import type { Cuahang } from "../../services/cuahangService";
import { MapPin, Star, Users, ArrowRight, Store } from "lucide-react"; // Cần cài lucide-react, nếu chưa có thì dùng SVG

interface CuahangCardProps {
  store: Cuahang;
}

const DEFAULT_IMAGE_URL = "/logoshopdefault.jpg";

// Hàm xử lý ảnh (Giữ nguyên logic của bạn)
const getImageUrl = (url?: string) => {
  if (!url) return DEFAULT_IMAGE_URL;
  if (url.startsWith("http") || url.startsWith("https")) return url;
  return `http://localhost:3000${url.startsWith("/") ? url : `/${url}`}`;
};

const CuahangCard: React.FC<CuahangCardProps> = ({ store }) => {
  const imageUrl = getImageUrl(store.MaHA_CuaHang_hinhanh?.URL);
  const loaiHinhKD = store.hdbanhang?.LoaiHinhKD;

  // Logic hiển thị địa chỉ ngắn gọn
  const address =
    store.hdbanhang?.DCLayHang ||
    store.hdbanhang?.DCLayHang ||
    "Chưa cập nhật địa chỉ";
  const shortAddress =
    address.split(",").slice(-2).join(", ").trim() || address;

  // Logic kiểm tra cửa hàng mới (ví dụ: tạo trong vòng 30 ngày)
  const isNew =
    store.hdbanhang?.NgayLap &&
    new Date().getTime() - new Date(store.hdbanhang?.NgayLap).getTime() <
      30 * 24 * 60 * 60 * 1000;

  return (
    <Link
      to={`/cuahang/${store.MaCH}`}
      className="group relative flex flex-col bg-white rounded-2xl shadow-lg  overflow-hidden hover:shadow-xl hover:border-emerald-200 transition-all duration-300 h-full"
    >
      {/* --- PHẦN 1: HÌNH ẢNH --- */}
      <div className="relative h-40 overflow-hidden">
        {/* Ảnh nền */}
        <img
          src={imageUrl}
          alt={store.TenCH}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = DEFAULT_IMAGE_URL;
          }}
        />

        {/* Lớp phủ gradient để làm nổi bật text bên trên nếu có */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60"></div>

        {/* Badge Loại hình kinh doanh (Góc trên trái) */}
        {loaiHinhKD && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm border border-emerald-100 uppercase tracking-wide">
            {loaiHinhKD}
          </span>
        )}

        {/* Badge Mới / Uy tín (Góc trên phải) */}
        <div className="absolute top-3 right-3 flex gap-1">
          {isNew && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm animate-pulse">
              MỚI
            </span>
          )}
          {store.DiemDG >= 4.5 && (
            <span className="bg-amber-400 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" /> UY TÍN
            </span>
          )}
        </div>
      </div>

      {/* --- PHẦN 2: NỘI DUNG --- */}
      <div className="p-4 flex flex-col flex-1">
        {/* Tên cửa hàng */}
        <div className="flex justify-between items-start mb-2">
          <h3
            className="text-base font-bold text-gray-800 line-clamp-1 group-hover:text-emerald-600 transition-colors"
            title={store.TenCH}
          >
            {store.TenCH}
          </h3>
          {/* Icon store nhỏ bên cạnh */}
          <Store className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
        </div>

        {/* Địa chỉ (Mới thêm) */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
          <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <span className="truncate" title={address}>
            {shortAddress}
          </span>
        </div>

        {/* Đường kẻ phân cách */}
        <div className="border-t border-gray-100 my-auto"></div>

        {/* Thống kê (Footer của card) */}
        <div className="flex items-center justify-between pt-3 mt-auto">
          {/* Điểm đánh giá */}
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-amber-700">
              {store.DiemDG?.toFixed(1) || "0.0"}
            </span>
          </div>

          {/* Người theo dõi */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Users className="w-3.5 h-3.5" />
            <span>
              {store.SLTheoDoi > 1000
                ? `${(store.SLTheoDoi / 1000).toFixed(1)}k`
                : store.SLTheoDoi || 0}
            </span>
          </div>
        </div>
      </div>

      {/* --- PHẦN 3: NÚT ACTION (Hiện khi hover) --- */}
      <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out">
        <div className="bg-emerald-500 text-white text-sm font-semibold py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2">
          Ghé thăm cửa hàng <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
};

export default CuahangCard;
