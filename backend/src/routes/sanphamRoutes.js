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
// ❌ XÓA HOÀN TOÀN DÒNG NÀY: import { authenticateToken } from "../middlewares/authMiddleware.js";

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
router.post("/", createSanpham);

// Lấy danh sách sản phẩm của cửa hàng tôi
router.get("/my/products", getMySanpham);

// Cập nhật sản phẩm của cửa hàng tôi
router.put("/:MaSP", updateSanpham);

// Xóa sản phẩm của cửa hàng tôi
router.delete("/:MaSP", deleteSanpham);

export default router;
