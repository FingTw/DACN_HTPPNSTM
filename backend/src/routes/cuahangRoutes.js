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
  getThongKeTonKho,
  getThongKeTonKhoFilter,
} from "../controllers/cuahangController.js";
// ❌ XÓA DÒNG NÀY: import { authenticateToken, requireStoreOwner } from "../middleware/auth.js";

const router = express.Router();

// 🟢 NOTE QUAN TRỌNG:
// - Routes được phân cấp rõ ràng: Public → Protected → Store Owner Only
// - Đăng ký cửa hàng BẮT BUỘC phải có tài khoản và đăng nhập
// - JWT được xử lý TRỰC TIẾP trong controller (không cần middleware)
// - Mỗi user chỉ được đăng ký 1 cửa hàng duy nhất

// ==================== PUBLIC ROUTES (Ai cũng xem được) ====================
// 🟢 KHÔNG cần đăng nhập - Cho khách vãng lai xem

// Lấy danh sách tất cả gian hàng
router.get("/", getAllCuahang);

// Tìm kiếm gian hàng theo tên
router.get("/search", searchCuahang);

// Lấy thông tin gian hàng theo mã
router.get("/:MaCH", getCuahangById);

// Cập nhật số lượng theo dõi (like/unlike) - Ai cũng được theo dõi
router.patch("/:MaCH/theo-doi", updateTheoDoi);

// Xem thống kê tồn kho của cửa hàng (public - chỉ xem, không sửa)
router.get("/:MaCH/thong-ke-ton-kho", getThongKeTonKho);

// ==================== PROTECTED ROUTES (Cần đăng nhập) ====================
// 🟢 BẮT BUỘC có tài khoản và đăng nhập
// 🛡 JWT được xử lý TRỰC TIẾP trong controller

// 🏪 ĐĂNG KÝ GIAN HÀNG MỚI - BẮT BUỘC ĐĂNG NHẬP (JWT trong controller)
router.post("/dang-ky", createCuahang);

// 📋 LẤY THÔNG TIN GIAN HÀNG CỦA TÔI - Chỉ xem cửa hàng của mình (JWT trong controller)
router.get("/tao/cua-hang-cua-toi", getMyCuahang);

// ==================== STORE OWNER ROUTES (Chỉ chủ cửa hàng) ====================
// 🟢 BẮT BUỘC vừa có tài khoản VỪA là chủ cửa hàng
// 🛡 Quyền sở hữu được kiểm tra TRỰC TIẾP trong controller

// ✏️ CHỈNH SỬA THÔNG TIN GIAN HÀNG CỦA TÔI - Chỉ chủ cửa hàng được sửa
router.put("/chinh-sua/:MaCH", updateCuahang);

// 🗑️ XÓA GIAN HÀNG CỦA TÔI - Chỉ chủ cửa hàng được xóa
router.delete("/xoa/:MaCH", deleteCuahang);

// 📊 THỐNG KÊ TỒN KHO CỬA HÀNG CỦA TÔI (với bộ lọc) - Chi tiết hơn
router.get("/tao/thong-ke-ton-kho/loc", getThongKeTonKhoFilter);

// 📊 THỐNG KÊ TỒN KHO CỬA HÀNG CỦA TÔI - Tổng quan
router.get("/tao/thong-ke-ton-kho", getThongKeTonKho);

export default router;

// 🟢 FLOW ĐĂNG KÝ CỬA HÀNG:
/*
1. ĐĂNG KÝ TÀI KHOẢN (nếu chưa có):
   POST /api/auth/register
   { "TenDangNhap": "user", "Email": "user@email.com", "MatKhau": "pass" }

2. ĐĂNG NHẬP LẤY TOKEN:
   POST /api/auth/login  
   { "TenDangNhap": "user", "MatKhau": "pass" }
   → Nhận token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

3. ĐĂNG KÝ CỬA HÀNG (với token):
   POST /api/cuahang/dang-ky
   Header: Authorization: Bearer {token}
   Body: {
     "TenCH": "Cửa Hàng Thời Trang ABC",
     "LoaiHinhKD": "Bán lẻ quần áo",
     "MaSoThue": "0123456789",
     "DCLayHang": "123 Đường ABC, TP.HCM"
   }

4. KẾT QUẢ:
   - Tạo cửa hàng mới với mã CHYYMM0001
   - Tạo hợp đồng bán hàng với mã HDYYMM0001  
   - Chuyển role user thành "Chủ Cửa Hàng"
   - User chỉ có thể đăng ký 1 cửa hàng duy nhất
*/

// 🟢 PHÂN QUYỀN RÕ RÀNG:
/*
👉 KHÁCH VÃNG LAI (không token):
   - Xem danh sách cửa hàng
   - Tìm kiếm cửa hàng  
   - Xem chi tiết cửa hàng
   - Theo dõi cửa hàng
   - Xem thống kê tồn kho (chỉ xem)

👉 USER ĐÃ ĐĂNG NHẬP (có token):
   - Tất cả quyền của Khách vãng lai
   - Đăng ký cửa hàng mới (chỉ 1 lần)
   - Xem cửa hàng của mình

👉 CHỦ CỬA HÀNG (có token + sở hữu cửa hàng):
   - Tất cả quyền của User đã đăng nhập  
   - Chỉnh sửa cửa hàng của mình
   - Xóa cửa hàng của mình (nếu không có sản phẩm)
   - Xem thống kê tồn kho chi tiết
   - Lọc thống kê tồn kho
*/

// 🟢 LƯU Ý QUAN TRỌNG:
/*
✅ JWT được xử lý TRỰC TIẾP trong mỗi controller function
✅ Không cần middleware - code đơn giản hơn
✅ Mỗi function tự verify token và kiểm tra quyền
✅ Dễ debug và bảo trì
*/
