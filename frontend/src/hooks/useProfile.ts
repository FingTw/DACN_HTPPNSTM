// src/hooks/useProfile.ts
import { useState, useEffect } from 'react';
import { authAPI } from '../services/authService';
import type { UserProfile, UpdateProfileData } from '../services/authService';

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Hàm load profile từ server - MỚI
  const loadProfileFromServer = async (): Promise<UserProfile | null> => {
    try {
      console.log('🔄 Loading profile from server...');
      const response = await authAPI.getProfile();
      
      if (response.data.data) {
        const profileData = response.data.data;
        console.log('✅ Profile loaded from server:', profileData);
        
        // Cập nhật localStorage với data mới nhất
        localStorage.setItem('user', JSON.stringify(profileData));
        
        return profileData;
      }
      return null;
    } catch (error: any) {
      console.error('❌ Error loading profile from server:', error);
      
      if (error.response?.status === 401) {
        // Token invalid, clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setError(error.response?.data?.message || 'Không thể tải thông tin từ server');
      }
      
      return null;
    }
  };

  // Cập nhật thông tin cá nhân - LUÔN LOAD LẠI TỪ SERVER SAU KHI UPDATE
  const updateProfile = async (data: UpdateProfileData) => {
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
        
        console.log('✅ Profile updated and reloaded from server');
      }
      
      setIsEditing(false);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Upload avatar - LUÔN LOAD LẠI TỪ SERVER
  const uploadAvatar = async (file: File) => {
    setUploadLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await authAPI.uploadAvatar(formData);
      
      // Load lại profile mới nhất từ server sau khi upload
      const freshProfile = await loadProfileFromServer();
      if (freshProfile) {
        setProfile(freshProfile);
      }
      
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Có lỗi xảy ra khi upload ảnh';
      setError(errorMessage);
      throw err;
    } finally {
      setUploadLoading(false);
    }
  };

  // Khởi tạo profile - ƯU TIÊN LOAD TỪ SERVER
  useEffect(() => {
    const initializeProfile = async () => {
      setLoading(true);
      console.log('🔄 useProfile hook initializing...');
      
      try {
        // Ưu tiên load từ server trước
        let user = await loadProfileFromServer();
        
        // Nếu server fail, thử load từ localStorage
        if (!user) {
          console.log('⚠️ Falling back to localStorage...');
          const userStr = localStorage.getItem('user');
          if (userStr) {
            user = JSON.parse(userStr);
            console.log('✅ Profile loaded from localStorage (fallback):', user);
          }
        }
        
        setProfile(user);
        
        if (!user) {
          setError('Không thể tải thông tin người dùng. Vui lòng đăng nhập lại.');
        }
      } catch (error) {
        console.error('❌ Error initializing profile:', error);
        setError('Không thể tải thông tin người dùng.');
      } finally {
        setLoading(false);
      }
    };

    initializeProfile();
  }, []);

  // Hàm refresh profile - MỚI
  const refreshProfile = async (): Promise<UserProfile | null> => {
    console.log('🔄 Manually refreshing profile...');
    const freshProfile = await loadProfileFromServer();
    if (freshProfile) {
      setProfile(freshProfile);
    }
    return freshProfile;
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
    refreshProfile, // Export function refresh
    clearError: () => setError(null),
  };
};