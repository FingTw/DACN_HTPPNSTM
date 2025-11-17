// src/routes/hinhanhRoutes.js
import express from "express";
import {
  addImageToProduct,
  addImageToStore,
  deleteImage,
  getImagesByProduct,
  getStoreImage,
  updateImageDescription,
} from "../controllers/hinhanhController.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// 🟢 THÊM HÌNH ẢNH CHO SẢN PHẨM
router.post("/product/:MaSP", upload.single("image"), addImageToProduct);

// 🟢 THÊM HÌNH ẢNH CHO CỬA HÀNG
router.post("/store", upload.single("image"), addImageToStore);

// 🟢 XÓA HÌNH ẢNH
router.delete("/:MaHA", deleteImage);

// 🟢 LẤY DANH SÁCH HÌNH ẢNH THEO SẢN PHẨM
router.get("/product/:MaSP", getImagesByProduct);

// 🟢 LẤY HÌNH ẢNH CỬA HÀNG
router.get("/store/:MaCH", getStoreImage);

// 🟢 CẬP NHẬT MÔ TẢ HÌNH ẢNH
router.put("/:MaHA/description", updateImageDescription);

export default router;
