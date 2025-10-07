import express from "express";
import authController from "../controllers/authController.js";


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

// router.get("/google", authController.googleLogin);

// router.get("/google/callback", authController.googleCallback);

export default router;
