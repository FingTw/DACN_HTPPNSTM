import express from "express";
import authController from "../controllers/authController.js";
import upload from '../config/upload.js';

const router = express.Router();

// Đăng ký
router.post("/register", authController.register);

// Đăng nhập
router.post("/login", authController.login);

// Đăng xuất
router.get("/logout", authController.logout);

// Quên mật khẩu
router.post("/forgot-password", authController.forgotPassword);

// Reset mật khẩu
router.post("/reset-password", authController.resetPassword);

// Đổi mật khẩu
router.post("/change-password", authController.changePassword);

// Cập nhật thông tin cá nhân
router.put("/update-personal-info", authController.updatePersonalInfo);

// Upload avatar
router.post("/upload-avatar", upload.single('avatar'), authController.uploadAvatar);

// Trong authRoutes.js
router.get("/profile", authController.getProfile);

router.post('/google', authController.googleLogin);
router.post('/facebook', authController.facebookLogin);
// API trả về config cho frontend
router.get('/client-config', (req, res) => {
  try {
    console.log('🔧 Providing client config to frontend');
    
    res.json({
      success: true,
      data: {
        googleClientId: process.env.GOOGLE_CLIENT_ID,
        facebookAppId: process.env.FACEBOOK_APP_ID,
        // Có thể thêm các config khác nếu cần
        frontendUrl: process.env.FRONTEND_URL
      }
    });
  } catch (error) {
    console.error('❌ Error providing client config:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy cấu hình'
    });
  }
});
export default router;
