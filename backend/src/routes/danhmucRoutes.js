// src/routes/danhmucRoutes.js
import express from "express";
import {
  getAllDanhMuc,
  getDanhMucById,
  createDanhMuc,
  updateDanhMuc,
  deleteDanhMuc,
  getCategoriesWithCount,
  searchDanhMuc,
  getPopularCategories,
} from "../controllers/danhmucController.js";

const router = express.Router();

// ======================================
// 🟢 PUBLIC ROUTES - KHÔNG CẦN ĐĂNG NHẬP
// ======================================

// 📋 Lấy tất cả danh mục (hỗ trợ includeCount query param)
// GET /api/categories
// GET /api/categories?includeCount=true
router.get("/", getAllDanhMuc);

// 📋 Lấy danh mục với số lượng sản phẩm
// GET /api/categories/with-count
router.get("/with-count", getCategoriesWithCount);

// 🔍 Tìm kiếm danh mục nâng cao
// GET /api/categories/tim-kiem
router.get("/tim-kiem", searchDanhMuc);

// 🏆 Lấy danh mục phổ biến
// GET /api/categories/pho-bien
router.get("/pho-bien", getPopularCategories);

// 📋 Lấy thông tin chi tiết danh mục
// GET /api/categories/:MaDM
router.get("/:MaDM", getDanhMucById);

// ======================================
// 🔐 PROTECTED ROUTES - CẦN ĐĂNG NHẬP
// ======================================

// 🆕 Tạo danh mục mới
// POST /api/categories
// Header: Authorization: Bearer {token}
router.post("/", createDanhMuc);

// ✏️ Cập nhật danh mục
// PUT /api/categories/:MaDM
// Header: Authorization: Bearer {token}
router.put("/:MaDM", updateDanhMuc);

// 🗑️ Xóa danh mục
// DELETE /api/categories/:MaDM
// Header: Authorization: Bearer {token}
router.delete("/:MaDM", deleteDanhMuc);

export default router;
