// src/pages/ProfilePage.tsx
import React, { useState, useEffect, useRef } from "react";
import { useProfile } from "../hooks/useProfile";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  ArrowLeft,
  Camera,
  Save,
  X,
  User,
  Mail,
  Phone,
  Shield,
} from "lucide-react";

const ProfilePage: React.FC = () => {
  const {
    profile,
    loading,
    uploadLoading,
    error,
    isEditing,
    setIsEditing,
    updateProfile,
    uploadAvatar,
    clearError,
  } = useProfile();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // State form local
  const [formData, setFormData] = useState({
    HoTen: "",
    SDT: "",
    Email: "",
    TenDangNhap: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // 🟢 HÀM XỬ LÝ URL ẢNH CHUẨN
  const getImageUrl = (url: string | undefined | null): string => {
    if (!url) return "https://github.com/shadcn.png";

    // Nếu là link online (google, facebook...) -> giữ nguyên
    if (url.startsWith("http")) return url;

    // Nếu là link tương đối từ server -> nối thêm localhost
    // Backend trả về: /uploads/filename.jpg
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    return `http://localhost:3000${cleanUrl}`;
  };

  // Cập nhật dữ liệu khi profile thay đổi
  useEffect(() => {
    if (profile) {
      setFormData({
        HoTen: profile.HoTen || "",
        SDT: profile.SDT || "",
        Email: profile.Email || "",
        TenDangNhap: profile.TenDangNhap || "",
      });

      // Cập nhật preview ảnh từ profile nếu chưa có preview local (hoặc khi profile update)
      if (profile.Avatar?.URL) {
        setAvatarPreview(getImageUrl(profile.Avatar.URL));
      }
    }
  }, [profile]);

  // Xử lý thay đổi input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) clearError();
  };

  // Xử lý chọn file ảnh
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate cơ bản
      if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
        alert("Vui lòng chọn file ảnh dưới 5MB");
        return;
      }

      setSelectedFile(file);

      // 1. Preview ngay lập tức (Client side preview)
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Tạo FormData để gửi cả text lẫn file
      const dataToSend = new FormData();
      dataToSend.append("HoTen", formData.HoTen);
      dataToSend.append("SDT", formData.SDT);
      dataToSend.append("Email", formData.Email);
      dataToSend.append("TenDangNhap", formData.TenDangNhap);

      // Nếu có chọn ảnh mới thì append vào
      if (selectedFile) {
        dataToSend.append("avatar", selectedFile); // Key phải là 'avatar' giống bên Route
      }

      // Gọi API update (Bạn cần sửa service để nhận FormData)
      await updateProfile(dataToSend);

      setIsEditing(false);
      // Reset file đã chọn
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
    }
  };
  const handleCancel = () => {
    if (profile) {
      setFormData({
        HoTen: profile.HoTen || "",
        SDT: profile.SDT || "",
        Email: profile.Email || "",
        TenDangNhap: profile.TenDangNhap || "",
      });
      // Reset về ảnh cũ từ server
      setAvatarPreview(getImageUrl(profile.Avatar?.URL));
    }
    setIsEditing(false);
    clearError();
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-500 font-medium">Đang tải hồ sơ...</span>
        </div>
      </div>
    );
  }

  // Fallback nếu không có profile (ví dụ chưa login)
  if (!profile) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Nút Quay lại */}
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-gray-500 hover:text-emerald-600 transition-colors mb-6 font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Quay lại
          </button>

          {/* Card Container */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            {/* 🟢 BANNER HEADER */}
            <div className="h-48 bg-gradient-to-r from-emerald-500 to-teal-600 relative">
              <div className="absolute inset-0 bg-black/10"></div>
            </div>

            {/* 🟢 AVATAR & MAIN INFO SECTION */}
            <div className="relative px-8 pb-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-20 mb-8 gap-6">
                {/* Avatar Circle */}
                <div className="relative group">
                  <div className="w-40 h-40 rounded-full border-[6px] border-white shadow-lg overflow-hidden bg-gray-200 relative">
                    <img
                      src={avatarPreview || "https://github.com/shadcn.png"}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://github.com/shadcn.png";
                      }}
                    />

                    {/* Overlay loading */}
                    {uploadLoading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  {/* Nút Camera */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadLoading}
                    // Cho phép bấm camera ngay cả khi không ở chế độ edit (UX tốt hơn)
                    // Hoặc giữ logic cũ: disabled={!isEditing}
                    className={`absolute bottom-2 right-2 p-2.5 rounded-full shadow-md transition-all duration-200 cursor-pointer bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-110 z-20`}
                    title="Đổi ảnh đại diện"
                  >
                    <Camera className="w-5 h-5" />
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* Tên & Role */}
                <div className="text-center sm:text-left flex-1 pb-2">
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">
                    {profile.HoTen || profile.TenDangNhap}
                  </h1>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-500 font-medium">
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm border border-emerald-100 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {profile.TenDangNhap}
                    </span>
                  </div>
                </div>

                {/* Nút Chỉnh sửa */}
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="hidden sm:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md"
                  >
                    Chỉnh sửa hồ sơ
                  </button>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 animate-pulse">
                  <span>⚠️</span> {error}
                </div>
              )}

              {/* 🟢 FORM THÔNG TIN */}
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {/* Field: Họ tên */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" /> Họ và tên
                    </label>
                    <input
                      type="text"
                      name="HoTen"
                      value={formData.HoTen}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 outline-none ${
                        isEditing
                          ? "bg-white border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                          : "bg-gray-50 border-transparent text-gray-600 cursor-not-allowed"
                      }`}
                      placeholder="Chưa cập nhật"
                    />
                  </div>

                  {/* Field: Số điện thoại */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" /> Số điện thoại
                    </label>
                    <input
                      type="text"
                      name="SDT"
                      value={formData.SDT}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 outline-none ${
                        isEditing
                          ? "bg-white border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                          : "bg-gray-50 border-transparent text-gray-600 cursor-not-allowed"
                      }`}
                      placeholder="Chưa cập nhật"
                    />
                  </div>

                  {/* Field: Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" /> Email
                    </label>
                    <input
                      type="email"
                      name="Email"
                      value={formData.Email}
                      onChange={handleChange}
                      disabled={!isEditing} // Email thường không cho sửa, hoặc logic riêng
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 outline-none ${
                        isEditing
                          ? "bg-white border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                          : "bg-gray-50 border-transparent text-gray-600 cursor-not-allowed"
                      }`}
                      placeholder="example@email.com"
                    />
                  </div>

                  {/* Field: Mã Tài Khoản */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-400" /> Mã tài khoản
                    </label>
                    <input
                      type="text"
                      value={profile.MaTK}
                      disabled
                      className="w-full px-4 py-3 rounded-xl border border-transparent bg-gray-100 text-gray-500 cursor-not-allowed font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="mt-10 flex items-center justify-end gap-4 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                    >
                      <X className="w-4 h-4" /> Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:shadow-xl transition-all transform active:scale-95 disabled:opacity-70 disabled:transform-none"
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <Save className="w-4 h-4" /> Lưu thay đổi
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Mobile Edit Button */}
                {!isEditing && (
                  <div className="mt-8 sm:hidden">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="w-full flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md"
                    >
                      Chỉnh sửa hồ sơ
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
