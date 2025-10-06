// import express from "express";
// import {
//   createCuahang,
//   getAllCuahang,
//   getCuahangById,
//   updateCuahang,
//   deleteCuahang,
//   getMyCuahang,
//   searchCuahang,
//   updateTheoDoi,
//   getThongKeTonKho,
//   getThongKeTonKhoFilter,
// } from "../controllers/cuahangController.js";
// import { authenticateToken } from "../middlewares/authMiddleware.js";

// const router = express.Router();

// // ======================================
// // 🟢 PUBLIC ROUTES - KHÔNG CẦN ĐĂNG NHẬP
// // ======================================

// // Lấy danh sách tất cả gian hàng
// router.get("/", getAllCuahang);

// // Tìm kiếm gian hàng theo tên
// router.get("/search", searchCuahang);

// // Lấy thông tin gian hàng theo mã
// router.get("/:MaCH", getCuahangById);

// // Cập nhật số lượng theo dõi cửa hàng
// router.patch("/:MaCH/theo-doi", updateTheoDoi);

// // 🟢 THÊM: Thống kê tồn kho không cần auth (tạm thời)
// router.get("/:MaCH/thong-ke-ton-kho", getThongKeTonKho);
// router.get("/:MaCH/thong-ke/filter", getThongKeTonKhoFilter);

// // ======================================
// // 🔐 PROTECTED ROUTES - CẦN ĐĂNG NHẬP
// // ======================================

// // Đăng ký gian hàng mới
// router.post("/", authenticateToken, createCuahang);

// // Lấy thông tin cửa hàng của tôi
// router.get("/my/store", authenticateToken, getMyCuahang);

// // Thống kê tồn kho cửa hàng của tôi (bản gốc)
// router.get("/my/store/thong-ke-ton-kho", authenticateToken, getThongKeTonKho);
// router.get("/my/store/thong-ke/filter", authenticateToken, getThongKeTonKhoFilter);

// // Cập nhật thông tin cửa hàng của tôi
// router.put("/:MaCH", authenticateToken, updateCuahang);

// // Xóa cửa hàng của tôi
// router.delete("/:MaCH", authenticateToken, deleteCuahang);

// export default router;

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
} from "../controllers/cuahangController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ======================================
// 🟢 PUBLIC ROUTES - KHÔNG CẦN ĐĂNG NHẬP
// ======================================

// Lấy danh sách tất cả gian hàng
router.get("/", getAllCuahang);

// Tìm kiếm gian hàng theo tên
router.get("/search", searchCuahang);

// Lấy thông tin gian hàng theo mã
router.get("/:MaCH", getCuahangById);

// Cập nhật số lượng theo dõi cửa hàng
router.patch("/:MaCH/theo-doi", updateTheoDoi);

// 🟢 THÊM: Thống kê tồn kho không cần auth (tạm thời)
router.get("/:MaCH/thong-ke-ton-kho", getThongKeTonKho);
router.get("/:MaCH/thong-ke/filter", getThongKeTonKhoFilter);

// ======================================
// 🔐 PROTECTED ROUTES - CẦN ĐĂNG NHẬP
// ======================================

// Đăng ký gian hàng mới
router.post("/", authenticateToken, createCuahang);

// Lấy thông tin cửa hàng của tôi
router.get("/my/store", authenticateToken, getMyCuahang);

// Thống kê tồn kho cửa hàng của tôi (bản gốc)
router.get("/my/store/thong-ke-ton-kho", authenticateToken, getThongKeTonKho);
router.get(
  "/my/store/thong-ke/filter",
  authenticateToken,
  getThongKeTonKhoFilter
);

// Cập nhật thông tin cửa hàng của tôi
router.put("/:MaCH", authenticateToken, updateCuahang);

// Xóa cửa hàng của tôi
router.delete("/:MaCH", authenticateToken, deleteCuahang);

export default router;
