import express from "express";
import {
  createKhuyenMai,
  getAllKhuyenMai,
  updateKhuyenMai,
  deleteKhuyenMai,
  assignKhuyenMaiToUser,
  getUserKhuyenMai
} from "../controllers/khuyenmaiController.js";

const router = express.Router();

router.post("/create", createKhuyenMai);         // Tạo mới
router.get("/getall", getAllKhuyenMai);          // Lấy tất cả
router.put("/:MaKM", updateKhuyenMai);     // Cập nhật
router.delete("/:MaKM", deleteKhuyenMai);  // Xoá
// ✅ Admin gán mã KM cho user
router.post("/assign", assignKhuyenMaiToUser);

// 📋 User lấy danh sách KM đã được gán cho mình
router.get("/my", getUserKhuyenMai);

export default router;
