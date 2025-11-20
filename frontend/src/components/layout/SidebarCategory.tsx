import React, { useState } from "react";
import {
  Apple,
  Milk,
  Beef,
  Egg,
  Wheat,
  Coffee,
  Leaf,
  Carrot,
  Fish,
  Cookie,
  Droplet,
  Heart,
  ShoppingBag,
  Truck,
  Award,
  Star,
  Gift,
  Users,
  BookOpen,
  MessageCircle,
  Home,
} from "lucide-react";

export default function FarmSidebar() {
  const [activeSection, setActiveSection] = useState("danh-muc");

  // Hide scrollbar CSS
  const style = document.createElement("style");
  style.textContent = `
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
  `;
  if (!document.querySelector("style[data-sidebar-scroll]")) {
    style.setAttribute("data-sidebar-scroll", "true");
    document.head.appendChild(style);
  }

  const categories = [
    {
      id: "farm-box",
      name: "Farm Boxes",
      icon: ShoppingBag,
      color: "text-green-600",
    },
    {
      id: "vegetables",
      name: "Rau - Củ - Quả",
      icon: Carrot,
      color: "text-orange-600",
    },
    { id: "fruits", name: "Trái Cây Tươi", icon: Apple, color: "text-red-600" },
    { id: "dairy", name: "Sữa & Trứng", icon: Milk, color: "text-blue-600" },
    { id: "meat", name: "Thịt Tươi Sống", icon: Beef, color: "text-red-700" },
    { id: "seafood", name: "Hải Sản Tươi", icon: Fish, color: "text-cyan-600" },
    {
      id: "grains",
      name: "Bánh Mì & Ngũ Cốc",
      icon: Wheat,
      color: "text-amber-700",
    },
    {
      id: "snacks",
      name: "Món Ăn Nhẹ",
      icon: Cookie,
      color: "text-yellow-600",
    },
    { id: "beverages", name: "Đồ Uống", icon: Coffee, color: "text-brown-600" },
    {
      id: "organic",
      name: "Hữu Cơ - Organic",
      icon: Leaf,
      color: "text-green-700",
    },
  ];

  const specialSections = [
    {
      id: "chuong-trinh",
      title: "Chương Trình",
      items: [
        {
          name: "Deal Hôm Nay",
          icon: Star,
          color: "text-yellow-500",
          badge: "HOT",
        },
        {
          name: "Freeship Xtra",
          icon: Truck,
          color: "text-blue-500",
          badge: "NEW",
        },
        { name: "Tích Điểm Đổi Quà", icon: Gift, color: "text-pink-500" },
        { name: "Sản Phẩm Cao Cấp", icon: Award, color: "text-purple-500" },
      ],
    },
    {
      id: "tien-ich",
      title: "Tiện Ích",
      items: [
        { name: "Nông Trại Đối Tác", icon: Home, color: "text-green-600" },
        { name: "Sức Khỏe & Dinh Dưỡng", icon: Heart, color: "text-red-500" },
        { name: "Công Thức Nấu Ăn", icon: BookOpen, color: "text-orange-500" },
        {
          name: "Cộng Đồng Yêu Thiên Nhiên",
          icon: Users,
          color: "text-teal-500",
        },
      ],
    },
    {
      id: "ho-tro",
      title: "Hỗ Trợ",
      items: [
        { name: "Trợ Lý Mua Sắm", icon: MessageCircle, color: "text-blue-600" },
      ],
    },
  ];

  return (
    <div
      className="w-64 bg-gray-100  h-screen overflow-y-auto scrollbar-hide sticky top-0"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {/* Main Card Container */}
      <div className="m-4  bg-white rounded-2xl shadow-lg">
        {/* Header */}
        <div className="p-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-green-600" />
            Danh mục
          </h2>
        </div>

        {/* Categories */}
        <div className="px-4 pb-4">
          <div className="bg-gray-100 rounded-xl">
            {categories.map((category, index) => (
              <button
                key={category.id}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors group ${
                  index === 0 ? "rounded-t-xl" : ""
                } ${index === categories.length - 1 ? "rounded-b-xl" : ""} ${
                  index !== categories.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >
                <category.icon className={`w-5 h-5 ${category.color}`} />
                <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Special Sections */}
        {specialSections.map((section) => (
          <div key={section.id} className="px-4 pb-4">
            <h3 className="px-2 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
              {section.title}
            </h3>
            <div className="bg-gray-100 rounded-xl">
              {section.items.map((item, index) => (
                <button
                  key={index}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-green-50 transition-colors group ${
                    index === 0 ? "rounded-t-xl" : ""
                  } ${
                    index === section.items.length - 1 ? "rounded-b-xl" : ""
                  } ${
                    index !== section.items.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">
                      {item.name}
                    </span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        item.badge === "HOT"
                          ? "bg-red-100 text-red-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Promotion Banner */}
        <div className="px-4 pb-4">
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-5 h-5 text-green-600" />
              <h4 className="font-bold text-green-800 text-sm">
                Farm Fresh VIP
              </h4>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Đăng ký ngay để nhận ưu đãi độc quyền
            </p>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition-colors">
              Tham gia ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
