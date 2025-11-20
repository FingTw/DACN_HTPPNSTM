// src/components/ProfilePage.tsx
import React, { useState, useEffect, useRef } from "react";
import { useProfile } from "../hooks/useProfile";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.target as HTMLImageElement;
  target.src = "/default-image.png"; // Fallback image
  target.onerror = null; // Ngăn lỗi lặp vô hạn
};

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
  const [formData, setFormData] = useState({
    HoTen: "",
    SDT: "",
    Email: "",
    TenDangNhap: "",
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Hàm xử lý URL ảnh
  const getImageUrl = (url: string | undefined | null): string => {
    if (!url) return "/default-avatar.png";

    // Nếu URL bắt đầu bằng /uploads, thêm domain (chỉ trong development)
    if (url.startsWith("/uploads/")) {
      return `http://localhost:3000${url}`;
    }

    // Nếu là URL đầy đủ
    if (url.startsWith("http")) {
      return url;
    }

    return "/default-avatar.png";
  };

  // Cập nhật form data khi profile thay đổi
  useEffect(() => {
    if (profile) {
      setFormData({
        HoTen: profile.HoTen || "",
        SDT: profile.SDT || "",
        Email: profile.Email || "",
        TenDangNhap: profile.TenDangNhap || "",
      });

      if (profile.Avatar?.URL) {
        setAvatarPreview(getImageUrl(profile.Avatar.URL));
      } else {
        setAvatarPreview("/default-avatar.png");
      }
    }
  }, [profile]);

  // DEBUG EFFECT - tách riêng
  useEffect(() => {
    console.log("🐛 Starting debug for product images...");

    // Cách 1: Network observer
    const performanceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes("product-")) {
          console.log("📡 Network request to product image:", entry.name);
        }
      });
    });
    performanceObserver.observe({ entryTypes: ["resource"] });

    // Cách 2: Error event listener
    const errorHandler = (event: ErrorEvent) => {
      if (event.message.includes("404") && event.filename) {
        console.log("❌ 404 Error:", event.filename);
      }
    };
    window.addEventListener("error", errorHandler);

    // Cách 3: Console error override
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0]?.includes?.("404") || args[1]?.includes?.("product-")) {
        console.log("🔍 Detailed 404 info:", {
          args: args,
          stack: new Error().stack,
        });
      }
      originalError.apply(console, args);
    };

    return () => {
      performanceObserver.disconnect();
      window.removeEventListener("error", errorHandler);
      console.error = originalError;
    };
  }, []); // QUAN TRỌNG: empty dependencies

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) clearError();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        clearError();
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        clearError();
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      uploadAvatar(file)
        .then(() => {
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        })
        .catch(() => {
          // Error handled in hook
        });
    }
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Loại bỏ các trường rỗng
      const payload: any = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== "") {
          payload[key] = value;
        }
      });

      await updateProfile(payload);
    } catch (err) {
      // Error đã được xử lý trong hook
    }
  };

  const handleCancel = () => {
    // Reset form data về giá trị ban đầu
    if (profile) {
      setFormData({
        HoTen: profile.HoTen || "",
        SDT: profile.SDT || "",
        Email: profile.Email || "",
        TenDangNhap: profile.TenDangNhap || "",
      });

      // Reset avatar preview
      if (profile.Avatar?.URL) {
        setAvatarPreview(getImageUrl(profile.Avatar.URL));
      } else {
        setAvatarPreview("/default-avatar.png");
      }
    }
    setIsEditing(false);
    clearError();
  };

  const handleBack = () => {
    if (isEditing) {
      handleCancel();
    } else {
      // Điều hướng về trang trước hoặc trang chủ
      window.history.back();
    }
  };

  if (!profile) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Đang tải thông tin...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <Header />
      <div style={styles.container}>
        {/* Header với nút back và tiêu đề */}
        <div style={styles.profileHeader}>
          <div style={styles.headerLeft}>
            <button
              style={styles.backButton}
              onClick={handleBack}
              title="Quay lại"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 style={styles.title}>Thông tin cá nhân</h1>
          </div>
          {!isEditing && (
            <button
              style={styles.editButton}
              onClick={() => setIsEditing(true)}
            >
              Chỉnh sửa
            </button>
          )}
        </div>

        {error && <div style={styles.errorMessage}>{error}</div>}

        <div style={styles.profileContent}>
          {/* Avatar section - Đơn giản hóa, chỉ còn upload file */}
          <div style={styles.avatarSection}>
            <div
              style={{
                ...styles.avatarPreview,
                ...(isEditing ? styles.avatarEditable : {}),
              }}
              onClick={handleAvatarClick}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  style={styles.avatarImage}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/default-avatar.png";
                    (e.target as HTMLImageElement).onerror = null;
                  }}
                />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  <span>No Avatar</span>
                </div>
              )}
              {isEditing && (
                <div style={styles.avatarOverlay}>
                  {uploadLoading ? (
                    <div style={styles.uploadLoading}>Đang upload...</div>
                  ) : (
                    <div style={styles.avatarEditText}>Click để đổi ảnh</div>
                  )}
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={styles.fileInput}
            />

            {isEditing && (
              <div style={styles.uploadHint}>Nhấn vào ảnh để đổi avatar</div>
            )}
          </div>

          {/* Profile form */}
          <form onSubmit={handleSubmit} style={styles.profileForm}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Mã tài khoản:</label>
              <input
                type="text"
                value={profile.MaTK}
                disabled
                style={styles.disabledInput}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Tên đăng nhập:</label>
              {isEditing ? (
                <input
                  type="text"
                  name="TenDangNhap"
                  value={formData.TenDangNhap}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              ) : (
                <input
                  type="text"
                  value={profile.TenDangNhap}
                  disabled
                  style={styles.disabledInput}
                />
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Họ và tên:</label>
              {isEditing ? (
                <input
                  type="text"
                  name="HoTen"
                  value={formData.HoTen}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Nhập họ và tên"
                />
              ) : (
                <div style={styles.profileValue}>
                  {profile.HoTen || "Chưa cập nhật"}
                </div>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email:</label>
              {isEditing ? (
                <input
                  type="email"
                  name="Email"
                  value={formData.Email}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Nhập email"
                />
              ) : (
                <div style={styles.profileValue}>
                  {profile.Email || "Chưa cập nhật"}
                </div>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Số điện thoại:</label>
              {isEditing ? (
                <input
                  type="text"
                  name="SDT"
                  value={formData.SDT}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Nhập số điện thoại"
                />
              ) : (
                <div style={styles.profileValue}>
                  {profile.SDT || "Chưa cập nhật"}
                </div>
              )}
            </div>

            {isEditing && (
              <div style={styles.formActions}>
                <button
                  type="submit"
                  style={{
                    ...styles.saveButton,
                    ...(loading ? styles.disabledButton : {}),
                  }}
                  disabled={loading}
                >
                  {loading ? "Đang cập nhật..." : "Lưu thay đổi"}
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.cancelButton,
                    ...(loading ? styles.disabledButton : {}),
                  }}
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Hủy
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

// CSS Styles
const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#f8f9fa",
    minHeight: "100vh",
  },
  loading: {
    textAlign: "center" as const,
    padding: "40px",
    fontSize: "18px",
    color: "#7f8c8d",
  },
  profileHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    borderBottom: "2px solid #e1e5e9",
    paddingBottom: "15px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  backButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    color: "#2c3e50",
  },
  title: {
    color: "#2c3e50",
    margin: 0,
    fontSize: "28px",
    fontWeight: 600,
  },
  editButton: {
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.3s ease",
  },
  errorMessage: {
    backgroundColor: "#fee",
    border: "1px solid #f5c6cb",
    color: "#721c24",
    padding: "12px",
    borderRadius: "6px",
    marginBottom: "20px",
  },
  profileContent: {
    display: "grid",
    gridTemplateColumns: "250px 1fr",
    gap: "40px",
    alignItems: "start",
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  avatarSection: {
    textAlign: "center" as const,
  },
  avatarPreview: {
    marginBottom: "15px",
    position: "relative" as const,
    cursor: "pointer",
    width: "150px",
    height: "150px",
    margin: "0 auto",
  },
  avatarEditable: {
    cursor: "pointer",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover" as const,
    border: "3px solid #e1e5e9",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    backgroundColor: "#e1e5e9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "3px solid #e1e5e9",
    color: "#7f8c8d",
    fontSize: "12px",
  },
  avatarOverlay: {
    position: "absolute" as const,
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "12px",
    fontWeight: 600,
    zIndex: 1,
  },
  avatarEditText: {
    textAlign: "center" as const,
    padding: "10px",
  },
  uploadLoading: {
    textAlign: "center" as const,
    color: "#3498db",
    fontWeight: 600,
  },
  uploadHint: {
    fontSize: "12px",
    color: "#7f8c8d",
    textAlign: "center" as const,
    marginTop: "10px",
  },
  fileInput: {
    display: "none",
  },
  profileForm: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column" as const,
  },
  label: {
    fontWeight: 600,
    marginBottom: "8px",
    color: "#2c3e50",
    fontSize: "14px",
  },
  input: {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
    transition: "all 0.3s ease",
  },
  disabledInput: {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
    backgroundColor: "#f8f9fa",
    color: "#6c757d",
    cursor: "not-allowed",
  },
  profileValue: {
    padding: "10px",
    backgroundColor: "#f8f9fa",
    border: "1px solid #e9ecef",
    borderRadius: "4px",
    color: "#495057",
    minHeight: "40px",
    display: "flex",
    alignItems: "center",
    fontSize: "14px",
  },
  formActions: {
    display: "flex",
    gap: "10px",
    marginTop: "20px",
  },
  saveButton: {
    backgroundColor: "#27ae60",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.3s ease",
  },
  cancelButton: {
    backgroundColor: "#95a5a6",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.3s ease",
  },
  disabledButton: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
};

// Thêm hover effects
const addHoverEffects = () => {
  const style = document.createElement("style");
  style.textContent = `
    button:hover:not(:disabled) {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    .back-button:hover {
      background-color: #e1e5e9 !important;
    }
    input:focus {
      outline: none;
      border-color: #3498db !important;
      box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
    }
  `;
  document.head.appendChild(style);
};

addHoverEffects();

export default ProfilePage;
