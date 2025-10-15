// routes/danhGiaCuaHangRoutes.js
import express from "express";
import {
  createDanhGiaCuaHang,
  getDanhGiaCuaHang,
  updateDanhGiaCuaHang,
  deleteDanhGiaCuaHang,
  getMyDanhGiaForCuaHang,
  getThongKeDanhGiaCuaHang,
  getAllMyDanhGiaCuaHang,
} from "../controllers/danhGiaCuaHangController.js";

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// 📋 Lấy danh sách đánh giá cửa hàng
// GET /api/danh-gia-cua-hang/:MaCH/danh-sach?page=1&limit=10&sort=newest
router.get("/:MaCH/danh-sach", getDanhGiaCuaHang);

// 📊 Lấy thống kê đánh giá cửa hàng
// GET /api/danh-gia-cua-hang/:MaCH/thong-ke
router.get("/:MaCH/thong-ke", getThongKeDanhGiaCuaHang);

// ==================== PROTECTED ROUTES ====================

// ⭐ Thêm đánh giá mới
// POST /api/danh-gia-cua-hang/:MaCH/them-moi
router.post("/:MaCH/them-moi", createDanhGiaCuaHang);

// 👀 Lấy đánh giá của tôi cho cửa hàng
// GET /api/danh-gia-cua-hang/:MaCH/cua-toi
router.get("/:MaCH/cua-toi", getMyDanhGiaForCuaHang);

// 📂 Lấy tất cả đánh giá của tôi
// GET /api/danh-gia-cua-hang/toan-bo-danh-gia-cua-toi/danh-sach?page=1&limit=10
router.get("/toan-bo-danh-gia-cua-toi/danh-sach", getAllMyDanhGiaCuaHang);

// ✏️ Cập nhật đánh giá của tôi
// PUT /api/danh-gia-cua-hang/:MaDG/cap-nhat
router.put("/:MaDG/cap-nhat", updateDanhGiaCuaHang);

// 🗑️ Xóa đánh giá của tôi
// DELETE /api/danh-gia-cua-hang/:MaDG/xoa
router.delete("/:MaDG/xoa", deleteDanhGiaCuaHang);

export default router;
