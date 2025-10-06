import express from "express";
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
} from "../controllers/authController.js";

const router = express.Router();

// Đăng ký
router.post("/register", register);

// Đăng nhập
router.post("/login", login);

// Đăng xuất
router.get("/logout", logout);

// Quên mật khẩu
router.post("/forgot-password", forgotPassword);

// Reset mật khẩu
router.post("/reset-password", resetPassword);

// Đổi mật khẩu
router.post("/change-password", changePassword);

export default router;
