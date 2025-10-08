// src/routes/storeRegistrationRoutes.js
import express from "express";
import storeRegistrationController from "../controllers/storeRegistrationController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// 🛡️ TẤT CẢ ROUTES ĐỀU CẦN XÁC THỰC JWT
router.use(authenticateToken);

// 🏪 ĐĂNG KÝ GIAN HÀNG MỚI
router.post("/register", storeRegistrationController.registerStore);

// 📋 LẤY THÔNG TIN GIAN HÀNG CỦA TÔI
router.get("/my-store", storeRegistrationController.getMyStoreInfo);

// ✏️ CẬP NHẬT THÔNG TIN HỢP ĐỒNG
router.put("/contract", storeRegistrationController.updateContractInfo);

// ✅ KIỂM TRA ĐIỀU KIỆN ĐĂNG KÝ GIAN HÀNG
router.get("/check-eligibility", storeRegistrationController.checkEligibility);

export default router;
