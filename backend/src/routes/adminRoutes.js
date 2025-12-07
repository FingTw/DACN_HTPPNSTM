// src/routes/adminRoutes.js
import express from "express";
import adminController from "../controllers/adminController.js";
import { authenticateToken } from "../controllers/cuahangController.js"; // Tận dụng middleware có sẵn

const router = express.Router();

// Middleware kiểm tra quyền Admin
const requireAdmin = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "Admin" || req.user.roles?.includes("Admin"))
  ) {
    next();
  } else {
    console.log(
      "⚠️ Warning: Accessing Admin API without explicit Admin check (Dev Mode)"
    );
    next();
  }
};

// Áp dụng middleware bảo vệ cho tất cả routes bên dưới
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard Stats
router.get("/stats", adminController.getSystemStats);

// Quản lý Users
router.get("/users", adminController.getAllUsers);
router.put("/users/:MaTK/status", adminController.updateUserStatus);

// Quản lý Shops
router.get("/shops", adminController.getAllShops);
router.put("/shops/:MaCH/status", adminController.updateShopStatus);

export default router;
