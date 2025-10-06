import express from "express";
import {
  getAllSanpham,
  getSanphamById,
  getSanphamByCuaHang,
  createSanpham,
  updateSanpham,
  deleteSanpham,
  getMySanpham,
} from "../controllers/sanphamcontroller.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ======================================
// 🟢 PUBLIC ROUTES - KHÔNG CẦN ĐĂNG NHẬP
// ======================================

// Lấy danh sách tất cả sản phẩm
router.get("/", getAllSanpham);

// Lấy thông tin sản phẩm theo mã
router.get("/:MaSP", getSanphamById);

// Lấy sản phẩm theo cửa hàng
router.get("/cuahang/:MaCH", getSanphamByCuaHang);

// ======================================
// 🔐 PROTECTED ROUTES - CẦN ĐĂNG NHẬP + CÓ CỬA HÀNG
// ======================================

// Thêm sản phẩm mới vào cửa hàng của tôi
router.post("/", authenticateToken, createSanpham);

// Lấy danh sách sản phẩm của cửa hàng tôi
router.get("/my/products", authenticateToken, getMySanpham);

// Cập nhật sản phẩm của cửa hàng tôi
router.put("/:MaSP", authenticateToken, updateSanpham);

// Xóa sản phẩm của cửa hàng tôi
router.delete("/:MaSP", authenticateToken, deleteSanpham);

export default router;
