// src/hooks/useProfile.ts
import { useState, useEffect } from "react";
import { authAPI } from "../services/authService";
import type { UserProfile, UpdateProfileData } from "../services/authService";

// Thêm interface cho hình ảnh
interface UserImage {
  MaHA: number;
  URL: string;
  TenHinh: string;
  MoTa: string | null;
  LoaiHinh: string;
  MaTK: number;
  createdAt: string;
  updatedAt: string;
}

interface EnhancedUserProfile extends UserProfile {
  Images?: UserImage[]; // Thêm mảng hình ảnh
  Avatar?: UserImage;   // Avatar là một hình ảnh đặc biệt
}

export const useProfile = () => {
  const [profile, setProfile] = useState<EnhancedUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Hàm xử lý và tìm avatar từ mảng hình ảnh
  const processUserImages = (userData: any): EnhancedUserProfile => {
    const images: UserImage[] = userData.Images || [];
    
    // Tìm avatar (có thể tìm theo LoaiHinh = 'avatar' hoặc là hình đầu tiên)
    const avatar = images.find(img => img.LoaiHinh === 'avatar') || 
                   images.find(img => img.TenHinh?.toLowerCase().includes('avatar')) ||
                   images[0]; // Fallback: hình đầu tiên

    return {
      ...userData,
      Images: images,
      Avatar: avatar
    };
  };

  // Hàm load profile từ server - CẢI THIỆN
  const loadProfileFromServer = async (): Promise<EnhancedUserProfile | null> => {
    try {
      console.log("🔄 Loading profile from server...");
      const response = await authAPI.getProfile();

      if (response.data.data) {
        const profileData = response.data.data;
        console.log("✅ Profile data from server:", profileData);

        // Xử lý hình ảnh và avatar
        const processedProfile = processUserImages(profileData);
        console.log("✅ Processed profile with images:", processedProfile);

        // Cập nhật localStorage với data mới nhất
        localStorage.setItem("user", JSON.stringify(processedProfile));

        return processedProfile;
      }
      return null;
    } catch (error: any) {
      console.error("❌ Error loading profile from server:", error);

      if (error.response?.status === 401) {
        // Token invalid, clear everything
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      } else {
        setError(
          error.response?.data?.message || "Không thể tải thông tin từ server"
        );
      }

      return null;
    }
  };

  // Cập nhật thông tin cá nhân
  const updateProfile = async (data: UpdateProfileData | FormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authAPI.updatePersonalInfo(data);

      if (response.data.data) {
        // Load lại profile mới nhất từ server sau khi update
        const freshProfile = await loadProfileFromServer();
        if (freshProfile) {
          setProfile(freshProfile);
        }

        console.log("✅ Profile updated and reloaded from server");
      }

      setIsEditing(false);
      return response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Có lỗi xảy ra khi cập nhật thông tin";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Upload avatar - CẢI THIỆN
  const uploadAvatar = async (file: File) => {
    setUploadLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      
      // Nếu có profile hiện tại, thêm MaTK để server biết update hình ảnh nào
      if (profile?.MaTK) {
        formData.append("MaTK", profile.MaTK.toString());
        formData.append("LoaiHinh", "avatar");
        formData.append("TenHinh", `avatar_${profile.MaTK}`);
      }

      console.log("📤 Uploading avatar with data:", {
        MaTK: profile?.MaTK,
        fileName: file.name,
        fileSize: file.size
      });

      const response = await authAPI.uploadAvatar(formData);

      // Load lại profile mới nhất từ server sau khi upload
      const freshProfile = await loadProfileFromServer();
      if (freshProfile) {
        setProfile(freshProfile);
      }

      return response.data;
    } catch (err: any) {
      console.error("❌ Error uploading avatar:", err);
      
      let errorMessage = "Có lỗi xảy ra khi upload ảnh";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setUploadLoading(false);
    }
  };

  // Khởi tạo profile
  useEffect(() => {
    const initializeProfile = async () => {
      setLoading(true);
      console.log("🔄 useProfile hook initializing...");

      try {
        // Ưu tiên load từ server trước
        let user = await loadProfileFromServer();

        // Nếu server fail, thử load từ localStorage
        if (!user) {
          console.log("⚠️ Falling back to localStorage...");
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const parsedUser = JSON.parse(userStr);
            user = processUserImages(parsedUser); // Xử lý hình ảnh cho localStorage
            console.log(
              "✅ Profile loaded from localStorage (fallback):",
              user
            );
          }
        }

        setProfile(user);

        if (!user) {
          setError(
            "Không thể tải thông tin người dùng. Vui lòng đăng nhập lại."
          );
        }
      } catch (error) {
        console.error("❌ Error initializing profile:", error);
        setError("Không thể tải thông tin người dùng.");
      } finally {
        setLoading(false);
      }
    };

    initializeProfile();
  }, []);

  // Hàm refresh profile
  const refreshProfile = async (): Promise<EnhancedUserProfile | null> => {
    console.log("🔄 Manually refreshing profile...");
    const freshProfile = await loadProfileFromServer();
    if (freshProfile) {
      setProfile(freshProfile);
    }
    return freshProfile;
  };

  // Hàm lấy URL ảnh chính xác
  const getAvatarUrl = (): string => {
    if (!profile?.Avatar?.URL) {
      return "https://github.com/shadcn.png";
    }

    const url = profile.Avatar.URL;
    
    // Nếu là link online (google, facebook...) -> giữ nguyên
    if (url.startsWith("http")) return url;

    // Nếu là link tương đối từ server -> nối thêm base URL
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    return `http://localhost:3000${cleanUrl}`;
  };

  return {
    profile,
    loading,
    uploadLoading,
    error,
    isEditing,
    setIsEditing,
    updateProfile,
    uploadAvatar,
    refreshProfile,
    getAvatarUrl, // Thêm hàm này
    clearError: () => setError(null),
  };
};