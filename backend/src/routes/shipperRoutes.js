// routes/shipperRoutes.js
import express from "express";
import upload from "../middlewares/uploadMiddleware.js";
import {
  getShipperOrders,
  acceptOrder,
  confirmDelivery,
  getShipperStats,
  getOrderDetail,
  cancelDelivery,
  getShipperProfile,
  updateShipperProfile,
  getMonthlyStats,
  uploadProofImage,
  confirmDeliveryWithImage,
  searchOrders,
} from "../controllers/shipperController.js";

const router = express.Router();

// DEBUG
router.use((req, res, next) => {
  console.log(`📍 Shipper Route: ${req.method} ${req.originalUrl}`);
  next();
});

// ==========================
// UPLOAD ẢNH CHỨNG TỪ RIÊNG
// ==========================
router.post(
  "/upload-proof",
  upload.single("image"), // field name FE gửi lên
  uploadProofImage
);

// ==========================
// ĐƠN HÀNG
// ==========================
router.get("/orders", getShipperOrders);
router.get("/orders/:MaDH/detail", getOrderDetail);
router.post("/orders/:MaDH/accept", acceptOrder);
router.post("/orders/:MaDH/cancel", cancelDelivery);

// --- CHỈ DÙNG 1 ROUTE HOÀN TẤT GIAO HÀNG ---
// ✔️ Đây là route có upload file
router.post(
  "/orders/:MaDH/complete-delivery",
  upload.single("proofImage"), // field name FE gửi lên
  confirmDeliveryWithImage      // xử lý + lưu ảnh
);

// Nếu bạn vẫn cần route confirmDelivery cũ (KHÔNG có ảnh) → đổi tên:
router.post("/orders/:MaDH/deliver", confirmDelivery);

// ==========================
// THỐNG KÊ
// ==========================
router.get("/stats", getShipperStats);
router.get("/stats/monthly", getMonthlyStats);

// ==========================
// TÌM KIẾM
// ==========================
router.get("/search", searchOrders);

// ==========================
// PROFILE
// ==========================
router.get("/profile", getShipperProfile);
router.put("/profile", updateShipperProfile);

export default router;
