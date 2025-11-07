// routes/cuahangRoutes.js
import express from "express";
import {
  createCuahang,
  getAllCuahang,
  getCuahangById,
  updateCuahang,
  deleteCuahang,
  getMyCuahang,
  searchCuahang,
  updateTheoDoi,
  getThongKeTonKho,
  getThongKeTonKhoFilter,
  authenticateToken, // ✅ THÊM MIDDLEWARE
} from "../controllers/cuahangController.js";

const router = express.Router();

// ==================== PUBLIC ROUTES (Ai cũng xem được) ====================
// 🟢 KHÔNG cần đăng nhập - Cho khách vãng lai xem

// Lấy danh sách tất cả gian hàng
router.get("/", getAllCuahang);

// Tìm kiếm gian hàng theo tên
router.get("/search", searchCuahang);

// Lấy thông tin gian hàng theo mã
router.get("/:MaCH", getCuahangById);

// Cập nhật số lượng theo dõi (like/unlike) - Ai cũng được theo dõi
router.patch("/:MaCH/theo-doi", updateTheoDoi);

// Xem thống kê tồn kho của cửa hàng (public - chỉ xem, không sửa)
router.get("/:MaCH/thong-ke-ton-kho", getThongKeTonKho);

// ==================== PROTECTED ROUTES (Cần đăng nhập) ====================
// 🟢 BẮT BUỘC có tài khoản và đăng nhập
// 🛡 Sử dụng middleware authenticateToken

// 🏪 ĐĂNG KÝ GIAN HÀNG MỚI - BẮT BUỘC ĐĂNG NHẬP
router.post("/dang-ky", authenticateToken, createCuahang);

// 📋 LẤY THÔNG TIN GIAN HÀNG CỦA TÔI - Chỉ xem cửa hàng của mình
router.get("/tao/cua-hang-cua-toi", authenticateToken, getMyCuahang);

// ==================== STORE OWNER ROUTES (Chỉ chủ cửa hàng) ====================
// 🟢 BẮT BUỘC vừa có tài khoản VỪA là chủ cửa hàng
// 🛡 Quyền sở hữu được kiểm tra trong controller

// ✏️ CHỈNH SỬA THÔNG TIN GIAN HÀNG CỦA TÔI - Chỉ chủ cửa hàng được sửa
router.put("/chinh-sua/:MaCH", authenticateToken, updateCuahang);

// 🗑️ XÓA GIAN HÀNG CỦA TÔI - Chỉ chủ cửa hàng được xóa
router.delete("/xoa/:MaCH", authenticateToken, deleteCuahang);

// 📊 THỐNG KÊ TỒN KHO CỬA HÀNG CỦA TÔI (với bộ lọc) - Chi tiết hơn
router.get(
  "/tao/thong-ke-ton-kho/loc",
  authenticateToken,
  getThongKeTonKhoFilter
);

// 📊 THỐNG KÊ TỒN KHO CỬA HÀNG CỦA TÔI - Tổng quan
router.get("/tao/thong-ke-ton-kho", authenticateToken, getThongKeTonKho);

export default router;
