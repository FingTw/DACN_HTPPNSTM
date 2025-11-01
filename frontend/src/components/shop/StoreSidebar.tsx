import React from "react";
import {
  Store,
  Package,
  Tag,
  TrendingUp,
  MessageSquare,
  Star,
  Users,
  Plus,
  Settings,
} from "lucide-react";

interface StoreSidebarProps {
  storeName?: string;
  storeImage?: string;
  rating?: number;
  followers?: number;
  isOfficial?: boolean;
  isFollowing?: boolean;
  onFollow?: () => void;
}

const StoreSidebar: React.FC<StoreSidebarProps> = ({
  storeName = "Nông Sản Việt",
  storeImage = "/logo.png",
  rating = 4.8,
  followers = 0,
  isOfficial = true,
  isFollowing = false,
  onFollow,
}) => {
  const navigationItems = [
    { icon: Store, label: "Cửa Hàng", href: "/store", active: true },
    { icon: Package, label: "Tất Cả Sản Phẩm", href: "/store/products" },
    { icon: Tag, label: "Bộ Sưu Tập", href: "/store/collections" },
    { icon: TrendingUp, label: "Giá Sốc Hôm Nay", href: "/store/deals" },
    { icon: MessageSquare, label: "Hỗ Sợ Cửa Hàng", href: "/store/support" },
  ];

  return (
    <div className="w-72 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
      {/* Store Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img
              src={storeImage}
              alt={storeName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg text-gray-900 truncate">
              {storeName}
            </h2>
            {isOfficial && (
              <div className="flex items-center gap-1 mt-1">
                <div className="bg-blue-500 rounded px-2 py-0.5 flex items-center gap-1">
                  <span className="text-white text-xs font-semibold">
                    ✓ OFFICIAL
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Store Stats */}
        <div className="flex items-center gap-4 text-sm mb-4">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold text-gray-900">{rating}</span>
            <span className="text-gray-500">/ 5</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Users className="w-4 h-4" />
            <span>
              Người theo dõi: <strong>{followers}</strong>
            </span>
          </div>
        </div>

        {/* Follow Button */}
        <button
          onClick={onFollow}
          className={`w-full py-2.5 rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
            isFollowing
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          <Plus className="w-4 h-4" />
          {isFollowing ? "Đang Theo Dõi" : "Theo Dõi"}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {navigationItems.map((item, index) => (
            <li key={index}>
              <a
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  item.active
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>

        {/* Store Info Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 px-4">
            Thông tin cửa hàng
          </h3>
          <div className="space-y-3 px-4 text-sm text-gray-600">
            <div>
              <div className="font-medium text-gray-900 mb-1">Sản phẩm</div>
              <div className="text-sm">156 sản phẩm</div>
            </div>
            <div>
              <div className="font-medium text-gray-900 mb-1">Tham gia</div>
              <div className="text-sm">3 tháng trước</div>
            </div>
            <div>
              <div className="font-medium text-gray-900 mb-1">
                Phản hồi chat
              </div>
              <div className="text-sm">98% (Trong vài giờ)</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <Settings className="w-4 h-4" />
          Cài đặt cửa hàng
        </button>
      </div>
    </div>
  );
};

export default StoreSidebar;
