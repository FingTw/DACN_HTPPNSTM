// routes/danhGiaSanPhamRoutes.js
import express from "express";
import {
  createDanhGiaSanPham,
  getDanhGiaSanPham,
  updateDanhGiaSanPham,
  deleteDanhGiaSanPham,
  getMyDanhGiaForSanPham,
  getThongKeDanhGiaSanPham,
} from "../controllers/danhGiaSanPhamController.js";

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// 📋 Lấy danh sách đánh giá sản phẩm
// GET /api/danh-gia-san-pham/:MaSP/danh-sach?page=1&limit=10&sort=newest&filter=all
router.get("/:MaSP/danh-sach", getDanhGiaSanPham);

// 📊 Lấy thống kê đánh giá sản phẩm
// GET /api/danh-gia-san-pham/:MaSP/thong-ke
router.get("/:MaSP/thong-ke", getThongKeDanhGiaSanPham);

// ==================== PROTECTED ROUTES ====================

// ⭐ Thêm đánh giá mới
// POST /api/danh-gia-san-pham/:MaSP/them-moi
router.post("/:MaSP/them-moi", createDanhGiaSanPham);

// 👀 Lấy đánh giá của tôi cho sản phẩm
// GET /api/danh-gia-san-pham/:MaSP/cua-toi
router.get("/:MaSP/cua-toi", getMyDanhGiaForSanPham);

// ✏️ Cập nhật đánh giá của tôi
// PUT /api/danh-gia-san-pham/:MaDG/cap-nhat
router.put("/:MaDG/cap-nhat", updateDanhGiaSanPham);

// 🗑️ Xóa đánh giá của tôi
// DELETE /api/danh-gia-san-pham/:MaDG/xoa
router.delete("/:MaDG/xoa", deleteDanhGiaSanPham);

export default router;
