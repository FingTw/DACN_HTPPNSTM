// CuahangCard.tsx - SỬA ROUTE PATH
import React from "react";
import { Link } from "react-router-dom";
import type { Cuahang } from "../../services/cuahangService";

interface CuahangCardProps {
  store: Cuahang;
}

const DEFAULT_IMAGE_URL = "/logoshopdefault.jpg";

const CuahangCard: React.FC<CuahangCardProps> = ({ store }) => {
  const imageUrl = store.MaHA_CuaHang_hinhanh?.URL || DEFAULT_IMAGE_URL;
  const loaiHinhKD = store.hdbanhang?.LoaiHinhKD;

  const handleClick = () => {
    console.log("Clicked store:", store.MaCH);
    console.log("Navigating to:", `/cuahang/${store.MaCH}`); // 🟢 SỬA THÀNH 'cuahang'
  };

  return (
    <Link
      to={`/cuahang/${store.MaCH}`} // 🟢 SỬA: '/cuahang' thay vì '/cua-hang'
      className="group bg-gray-100 rounded-2xl shadow-sm hover:shadow-lg overflow-hidden transform hover:-translate-y-1 transition-all duration-300 border border-gray-100 hover:border-emerald-200 block"
      onClick={handleClick}
    >
      <div className="relative h-32 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50">
        <img
          className="rounded-xl h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
          src={imageUrl}
          alt={store.TenCH}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = DEFAULT_IMAGE_URL;
            target.className += " bg-emerald-100 p-3";
          }}
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Badge nhỏ gọn */}
        {loaiHinhKD && (
          <span className="absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-full bg-emerald-500/90 text-white backdrop-blur-sm">
            {loaiHinhKD}
          </span>
        )}
      </div>

      {/* Content Section - compact */}
      <div className="p-3 rounded-xl">
        {/* Tên cửa hàng */}
        <h3
          className="text-sm font-bold text-gray-800 group-hover:text-emerald-600 transition-colors line-clamp-2 mb-2 min-h-[2.5rem]"
          title={store.TenCH}
        >
          {store.TenCH}
        </h3>

        {/* Thông tin rút gọn */}
        <div className="space-y-1.5">
          {/* Followers */}
          <div className="flex items-center text-xs text-gray-500">
            <svg
              className="h-3.5 w-3.5 text-rose-400 mr-1.5 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold text-gray-700">
              {store.SLTheoDoi?.toLocaleString() || 0}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center text-xs text-gray-500">
            <svg
              className="h-3.5 w-3.5 text-amber-400 mr-1.5 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-semibold text-gray-700">
              {store.DiemDG?.toFixed(1) || "0.0"}
            </span>
            <span className="ml-0.5">điểm</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CuahangCard;
