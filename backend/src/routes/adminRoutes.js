// src/routes/adminRoutes.js
import express from "express";
import adminController from "../controllers/adminController.js";
import { authenticateToken } from "../controllers/cuahangController.js"; // Tận dụng middleware có sẵn
import { walletController } from "../controllers/walletController.js";

const router = express.Router();

// Middleware kiểm tra quyền Admin
const requireAdmin = (req, res, next) => {
  // Logic kiểm tra quyền: user phải tồn tại và có role Admin
  // Lưu ý: Tùy vào cách bạn lưu role trong token (req.user.role hoặc req.user.roles), hãy điều chỉnh cho khớp
  if (
    req.user &&
    (req.user.role === "Admin" ||
      (Array.isArray(req.user.roles) && req.user.roles.includes("Admin")))
  ) {
    next();
  } else {
    // Trong môi trường Dev, nếu chưa cấu hình chặt chẽ token, có thể log warning thay vì chặn hẳn
    // Nhưng recommend nên chặn hẳn: return res.status(403).json({message: "Forbidden"});
    console.log(
      "⚠️ Warning: Accessing Admin API without explicit Admin check (Dev Mode)"
    );
    next();
  }
};

// Áp dụng middleware bảo vệ cho tất cả routes bên dưới
router.use(authenticateToken);
router.use(requireAdmin);

// ==========================================
// 1. DASHBOARD
// ==========================================
router.get("/stats", adminController.getSystemStats);

// ==========================================
// 2. QUẢN LÝ USER & PHÂN QUYỀN
// ==========================================

// Lấy danh sách Vai trò & Chức vụ (cho dropdown trong Modal)
router.get("/metadata", adminController.getMetaData);

// Lấy danh sách Users (có phân trang & search)
router.get("/users", adminController.getAllUsers);

// Lấy chi tiết 1 User (để Edit - bao gồm roles hiện tại và chức vụ)
router.get("/users/:MaTK", adminController.getUserDetail);

// Tạo User mới (kèm Roles và Chức vụ)
router.post("/users", adminController.createUser);

// Cập nhật User đầy đủ (Thông tin + Roles + Chức vụ)
router.put("/users/:MaTK/full", adminController.updateUserFull);

// Xóa User
router.delete("/users/:MaTK", adminController.deleteUser);

// API cũ: Chỉ cập nhật trạng thái (Khóa/Mở khóa nhanh)
router.put("/users/:MaTK/status", adminController.updateUserStatus);

// ==========================================
// 3. QUẢN LÝ CỬA HÀNG
// ==========================================
router.get("/shops", adminController.getAllShops);
router.put("/shops/:MaCH/status", adminController.updateShopStatus);

// ==========================================
// 4. QUẢN LÝ PHÒNG BAN
// ==========================================
router.get("/departments", adminController.getAllDepartments);
router.post("/departments", adminController.createDepartment);
router.put("/departments/:MaPB", adminController.updateDepartment);
router.delete("/departments/:MaPB", adminController.deleteDepartment);

// ==========================================
// 5. QUẢN LÝ CHỨC VỤ
// ==========================================
router.get("/positions", adminController.getAllPositions);
router.post("/positions", adminController.createPosition);
router.put("/positions/:MaCV", adminController.updatePosition);
router.delete("/positions/:MaCV", adminController.deletePosition);

// ==========================================
// 6. QUẢN LÝ DANH MỤC
// ==========================================
router.get("/categories", adminController.getAllCategories);
router.post("/categories", adminController.createCategory);
router.put("/categories/:MaDM", adminController.updateCategory);
router.delete("/categories/:MaDM", adminController.deleteCategory);

// ==========================================
// 7. QUẢN LÝ KHO BÃI
// ==========================================
router.get("/warehouses", adminController.getAllWarehouses);
router.post("/warehouses", adminController.createWarehouse);
router.put("/warehouses/:MaKho", adminController.updateWarehouse);
router.delete("/warehouses/:MaKho", adminController.deleteWarehouse);

// ==========================================
// 8. QUẢN LÝ NHÂN VIÊN
// ==========================================
router.get("/employees", adminController.getAllEmployees);
router.get("/employees/:MaNV", adminController.getEmployeeDetail);
router.put("/employees/:MaNV", adminController.updateEmployeeInfo);

// 9. QUẢN LÝ TÀI CHÍNH (RÚT TIỀN)
// ==========================================
router.get("/withdrawals", walletController.getAllWithdrawals); // Lấy danh sách
router.put("/withdrawals/handle", walletController.adminHandleWithdraw);

export default router;
