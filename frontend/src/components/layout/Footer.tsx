import React, { useState } from "react";

// Types for better maintainability
interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
  icon?: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface Certificate {
  name: string;
  icon: string;
  description: string;
}

export const Footer: React.FC = () => {
  // Data for maintainability - can be moved to a separate file
  const footerSections: FooterSection[] = [
    {
      title: "Thông tin thương hiệu",
      links: [
        { label: "Về chúng tôi", href: "/ve-chung-toi", icon: "🏢" },
        { label: "Triết lý nông nghiệp", href: "/triet-ly-nong-nghiep", icon: "🌱" },
        { label: "Tin tức & Sự kiện", href: "/tin-tuc", icon: "📰" },
        { label: "Tuyển dụng", href: "/tuyen-dung", icon: "👥" },
      ],
    },
    {
      title: "Hỗ trợ khách hàng",
      links: [
        { label: "Câu hỏi thường gặp", href: "/faq", icon: "❓" },
        { label: "Hướng dẫn mua hàng", href: "/huong-dan-mua-hang", icon: "🛒" },
        { label: "Chính sách giao hàng", href: "/chinh-sach-giao-hang", icon: "🚚" },
        { label: "Chính sách đổi trả", href: "/chinh-sach-doi-tra", icon: "🔄" },
        { label: "Chính sách bảo mật", href: "/chinh-sach-bao-mat", icon: "🔒" },
        { label: "Liên hệ hỗ trợ", href: "/lien-he", icon: "📞" },
      ],
    },
    {
      title: "Quản lý & Đối tác",
      links: [
        { label: "Đăng ký Đối tác nông trại", href: "/dang-ky-doi-tac", icon: "👨‍🌾" },
        { label: "Chính sách đại lý", href: "/chinh-sach-dai-ly", icon: "📋" },
        { label: "Tra cứu đơn hàng", href: "/tra-cuu-don-hang", icon: "🔍" },
        { label: "Theo dõi vận chuyển", href: "/theo-doi-van-chuyen", icon: "📦" },
        { label: "Hệ thống kho hàng", href: "/kho-hang", icon: "🏪" },
      ],
    },
    {
      title: "Chứng nhận & An toàn",
      links: [
        { label: "Chứng nhận VSATTP", href: "/chung-nhan-vsattp", icon: "🏭" },
        { label: "Chứng nhận hữu cơ", href: "/chung-nhan-huu-co", icon: "🌿" },
        { label: "Tiêu chuẩn GlobalGAP", href: "/globalgap", icon: "🌍" },
        { label: "Hệ thống truy xuất nguồn gốc", href: "/truy-xuat-nguon-goc", icon: "🔗" },
        { label: "Quy trình sản xuất", href: "/quy-trinh-san-xuat", icon: "⚙️" },
        { label: "Kiểm định chất lượng", href: "/kiem-dinh-chat-luong", icon: "🧪" },
      ],
    },
  ];

  const certificates: Certificate[] = [
    { 
      name: "VSATTP", 
      icon: "🏭", 
      description: "Vệ sinh an toàn thực phẩm" 
    },
    { 
      name: "VietGAP", 
      icon: "🌱", 
      description: "Tiêu chuẩn nông nghiệp" 
    },
    { 
      name: "GlobalGAP", 
      icon: "🌍", 
      description: "Tiêu chuẩn quốc tế" 
    },
    { 
      name: "Hữu cơ", 
      icon: "🍃", 
      description: "Sản phẩm hữu cơ" 
    },
    { 
      name: "ISO 22000", 
      icon: "📋", 
      description: "An toàn thực phẩm" 
    },
    { 
      name: "Traceability", 
      icon: "🔗", 
      description: "Truy xuất nguồn gốc" 
    },
  ];

  const [email, setEmail] = useState("");
  const [mobileOpenSections, setMobileOpenSections] = useState<number[]>([]);

  const toggleSection = (index: number) => {
    setMobileOpenSections(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Subscribed with:", email);
    setEmail("");
  };

  return (
    <footer className="bg-white text-gray-800">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Brand Info & Newsletter - Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mr-4 shadow-md">
                <span className="text-3xl text-white">🌿</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Nông Sản Việt</h2>
                <p className="text-emerald-600 italic text-lg">Thực phẩm sạch - Bữa ăn an lành</p>
              </div>
            </div>
            
            <div className="space-y-3 text-gray-700">
              <p className="flex items-center">
                <span className="mr-3 text-emerald-600 text-xl">📍</span>
                <span className="text-lg">Số 123, Đường Nông nghiệp, Quận 1, TP. Hồ Chí Minh</span>
              </p>
              <p className="flex items-center">
                <span className="mr-3 text-emerald-600 text-xl">📞</span>
                <span className="text-lg font-semibold text-gray-900">Hotline: 1900 1234</span>
                <span className="mx-3 text-gray-400">|</span>
                <span className="text-gray-600">(7:00 - 22:00)</span>
              </p>
              <p className="flex items-center">
                <span className="mr-3 text-emerald-600 text-xl">✉️</span>
                <span className="text-lg">Email: info@nongsanxanh.vn</span>
              </p>
            </div>

            {/* Social Media
            <div className="mt-8">
              <p className="text-gray-700 font-medium mb-4">Kết nối với chúng tôi:</p>
              <div className="flex space-x-4">
                {[
                  { platform: 'facebook', icon: '📘', label: 'Facebook', color: 'hover:bg-blue-100 hover:text-blue-600 hover:border-blue-300' },
                  { platform: 'youtube', icon: '📺', label: 'YouTube', color: 'hover:bg-red-100 hover:text-red-600 hover:border-red-300' },
                  { platform: 'zalo', icon: '💬', label: 'Zalo OA', color: 'hover:bg-blue-100 hover:text-blue-500 hover:border-blue-300' },
                  { platform: 'tiktok', icon: '🎵', label: 'TikTok', color: 'hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300' },
                  { platform: 'instagram', icon: '📷', label: 'Instagram', color: 'hover:bg-pink-100 hover:text-pink-600 hover:border-pink-300' }
                ].map((social) => (
                  <a
                    key={social.platform}
                    href="#"
                    className={`flex flex-col items-center w-16 p-3 rounded-xl bg-white border border-gray-200 shadow-sm transition-all duration-300 ${social.color}`}
                    aria-label={social.label}
                  >
                    <span className="text-2xl mb-1">{social.icon}</span>
                    <span className="text-xs font-medium">{social.label}</span>
                  </a>
                ))}
              </div>
            </div> */}
          </div>

          {/* Newsletter Section */}
          <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-6 shadow-sm border border-emerald-200">
            <h3 className="text-xl font-bold text-emerald-800 mb-3">
              📧 Nhận tin khuyến mãi
            </h3>
            <p className="text-gray-600 mb-6 text-base">
              Đăng ký để nhận thông tin sản phẩm mới và ưu đãi đặc biệt từ nông trại
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn..."
                  className="w-full px-5 py-4 bg-white border-2 border-emerald-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300"
                  required
                />
                <div className="absolute right-3 top-3">
                  <span className="text-emerald-400">✉️</span>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-lg rounded-xl hover:from-emerald-600 hover:to-green-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-200 shadow-md"
              >
                ĐĂNG KÝ NGAY
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-4 text-center">
              📝 Chúng tôi cam kết bảo mật thông tin của bạn
            </p>
          </div>
        </div>

        {/* Main Content Grid with Normal Background */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {footerSections.map((section, index) => (
            <div key={section.title} className="space-y-4">
              {/* Section Header - với nền xanh lá */}
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <span className="mr-2 text-xl">
                    {index === 0 ? "🏢" : 
                     index === 1 ? "🤝" : 
                     index === 2 ? "🔐" : "🏆"}
                  </span>
                  {section.title}
                </h3>
              </div>
              
              {/* Links List - không nền */}
              <ul className="space-y-2 pl-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : "_self"}
                      rel={link.external ? "noopener noreferrer" : ""}
                      className="flex items-center text-gray-700 hover:text-emerald-600 hover:underline decoration-emerald-300 transition-colors duration-200 group"
                    >
                      <span className="mr-3 text-lg opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200">
                        {link.icon}
                      </span>
                      <span className="flex-1">{link.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mobile Accordion */}
        <div className="md:hidden space-y-4 mb-8">
          {footerSections.map((section, index) => (
            <div key={section.title} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <button
                onClick={() => toggleSection(index)}
                className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white flex justify-between items-center"
                aria-expanded={mobileOpenSections.includes(index)}
              >
                <div className="flex items-center">
                  <span className="mr-3 text-xl">
                    {index === 0 ? "🏢" : 
                     index === 1 ? "🤝" : 
                     index === 2 ? "🔐" : "🏆"}
                  </span>
                  <span className="font-bold">
                    {section.title}
                  </span>
                </div>
                <span className="text-xl">
                  {mobileOpenSections.includes(index) ? "−" : "+"}
                </span>
              </button>
              {mobileOpenSections.includes(index) && (
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          className="flex items-center text-gray-700 hover:text-emerald-600 py-2 group"
                        >
                          <span className="mr-3 text-lg">{link.icon}</span>
                          <span className="flex-1">{link.label}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Certificates Grid - Full width (GIỮ NGUYÊN TỪ ĐÂY) */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900">HỆ THỐNG CHỨNG NHẬN & TIÊU CHUẨN</h3>
            <p className="text-gray-600 mt-2">Cam kết chất lượng và an toàn thực phẩm</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {certificates.map((cert) => (
              <div
                key={cert.name}
                className="bg-gradient-to-b from-emerald-50 to-white rounded-xl p-5 text-center border border-emerald-100 hover:border-emerald-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {cert.icon}
                </div>
                <div className="font-bold text-emerald-800 text-lg mb-1">{cert.name}</div>
                <div className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                  {cert.description}
                </div>
                <div className="mt-4 h-1 w-12 mx-auto bg-gradient-to-r from-emerald-400 to-green-400 rounded-full group-hover:w-20 transition-all duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar - Clean and Simple */}
      <div className="bg-gradient-to-r from-emerald-900 to-green-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
            {/* Copyright and Legal */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start mb-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-lg">🌿</span>
                </div>
                <p className="text-xl font-bold">
                  Nông Sản Việt
                </p>
              </div>
              <p className="text-emerald-200">
                © 2025 Nông Sản Việt. Mọi quyền được bảo lưu.
              </p>
              <p className="text-sm text-emerald-300/80 mt-2">
                ĐKKD: 0123456789 • GPKD: 01/GP-STTTT • MST: 1234567890
              </p>
            </div>
            
            {/* Quick Links */}
            <div className="flex flex-wrap justify-center gap-6">
              <a 
                href="/chinh-sach-bao-mat" 
                className="text-emerald-200 hover:text-white hover:underline transition-colors decoration-white/50 hover:decoration-white font-medium"
              >
                Chính sách bảo mật
              </a>
              <a 
                href="/dieu-khoan-dich-vu" 
                className="text-emerald-200 hover:text-white hover:underline transition-colors decoration-white/50 hover:decoration-white font-medium"
              >
                Điều khoản dịch vụ
              </a>
              <a 
                href="/lien-he" 
                className="text-emerald-200 hover:text-white hover:underline transition-colors decoration-white/50 hover:decoration-white font-medium"
              >
                Liên hệ hợp tác
              </a>
              <a 
                href="/sitemap" 
                className="text-emerald-200 hover:text-white hover:underline transition-colors decoration-white/50 hover:decoration-white font-medium"
              >
                Sơ đồ website
              </a>
            </div>
          </div>

          {/* Divider */}
          <div className="my-6 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"></div>

          {/* Mission Statement */}
          <div className="text-center">
            <p className="text-emerald-100 italic text-lg">
              "Vì một Việt Nam khỏe mạnh từ những bữa ăn an toàn"
            </p>
            <p className="text-sm text-emerald-300/80 mt-2">
              Đồng hành cùng nông dân Việt - Phục vụ người tiêu dùng Việt
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};