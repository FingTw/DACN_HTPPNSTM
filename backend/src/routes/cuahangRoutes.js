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
  getStoreStats,
  getTopStores,
  addStoreImage,
  getThongKeTonKho,
  getThongKeTonKhoFilter,
  authenticateToken,
} from "../controllers/cuahangController.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
router.get("/", getAllCuahang);
router.get("/top", getTopStores);
router.get("/tim-kiem", searchCuahang);
router.get("/:MaCH", getCuahangById);
router.patch("/:MaCH/theo-doi", updateTheoDoi);
router.get("/:MaCH/thong-ke-ton-kho", getThongKeTonKho);

// ==================== PROTECTED ROUTES ====================
router.post(
  "/dang-ky",
  authenticateToken,
  upload.single("image"),
  createCuahang
);

router.get("/cua-toi/thong-tin", authenticateToken, getMyCuahang);
router.get("/cua-toi/thong-ke", authenticateToken, getStoreStats);

// ==================== STORE OWNER ROUTES ====================
router.put(
  "/chinh-sua/:MaCH",
  authenticateToken,
  upload.single("image"),
  updateCuahang
);

router.post(
  "/:MaCH/hinh-anh",
  authenticateToken,
  upload.single("image"),
  addStoreImage
);

router.delete("/xoa/:MaCH", authenticateToken, deleteCuahang);

// ==================== INVENTORY MANAGEMENT ROUTES ====================
router.get("/cua-toi/thong-ke-ton-kho", authenticateToken, getThongKeTonKho);
router.get(
  "/cua-toi/thong-ke-ton-kho/loc",
  authenticateToken,
  getThongKeTonKhoFilter
);

export default router;
