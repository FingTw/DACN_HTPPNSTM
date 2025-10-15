// routes/sanphamRoutes.js
import express from "express";
import {
  getAllSanpham,
  getSanphamById,
  getSanphamByCuaHang,
  createSanpham,
  updateSanpham,
  deleteSanpham,
  getMySanpham,
  searchSanpham,
} from "../controllers/sanphamController.js";

const router = express.Router();

// ======================================
// 🟢 PUBLIC ROUTES - KHÔNG CẦN ĐĂNG NHẬP
// ======================================

// 🔍 Lấy danh sách tất cả sản phẩm (có phân trang, tìm kiếm, lọc)
// GET /api/sanpham?page=1&limit=10&search=iphone&minPrice=1000000&maxPrice=5000000&minRating=4
router.get("/", getAllSanpham);

// 🔍 Tìm kiếm sản phẩm nâng cao
// GET /api/sanpham/tim-kiem?keyword=iphone&minPrice=1000000&minRating=4&MaCH=CH001
router.get("/tim-kiem", searchSanpham);

// 📋 Lấy thông tin chi tiết sản phẩm theo mã
// GET /api/sanpham/SP001?include=hinhanh,danhmuc,danhgia
router.get("/:MaSP", getSanphamById);

// 🏪 Lấy sản phẩm theo cửa hàng
// GET /api/sanpham/cua-hang/CH001?page=1&limit=10&include=hinhanh
router.get("/cua-hang/:MaCH", getSanphamByCuaHang);

// ======================================
// 🔐 PROTECTED ROUTES - CẦN ĐĂNG NHẬP + CÓ CỬA HÀNG
// ======================================

// 🆕 Thêm sản phẩm mới vào cửa hàng của tôi
// POST /api/sanpham/tao-moi
// Header: Authorization: Bearer {token}
router.post("/tao-moi", createSanpham);

// 📦 Lấy danh sách sản phẩm của cửa hàng tôi
// GET /api/sanpham/cua-hang-cua-toi/danh-sach?page=1&limit=10&include=hinhanh
// Header: Authorization: Bearer {token}
router.get("/cua-hang-cua-toi/danh-sach", getMySanpham);

// ✏️ Cập nhật sản phẩm của cửa hàng tôi
// PUT /api/sanpham/cap-nhat/:MaSP
// Header: Authorization: Bearer {token}
router.put("/cap-nhat/:MaSP", updateSanpham);

// 🗑️ Xóa sản phẩm của cửa hàng tôi
// DELETE /api/sanpham/xoa/:MaSP
// Header: Authorization: Bearer {token}
router.delete("/xoa/:MaSP", deleteSanpham);

// 🟢 THÊM DÒNG NÀY - EXPORT DEFAULT
export default router;

// 🟢 FLOW SỬ DỤNG:
/*
1. KHÁCH VÃNG LAI:
   - Xem danh sách sản phẩm
   - Tìm kiếm sản phẩm
   - Xem chi tiết sản phẩm
   - Xem sản phẩm theo cửa hàng

2. CHỦ CỬA HÀNG (đã đăng nhập):
   - Tất cả quyền của Khách vãng lai
   - Thêm sản phẩm mới
   - Xem sản phẩm của cửa hàng mình
   - Cập nhật sản phẩm của mình
   - Xóa sản phẩm của mình

3. QUYỀN TRUY CẬP:
   - PUBLIC: GET /api/sanpham/**
   - PROTECTED: POST, PUT, DELETE /api/sanpham/**
*/

// 🟢 VÍ DỤ TEST TRONG POSTMAN:
/*
👉 PUBLIC ROUTES (không cần token):
GET http://localhost:3000/api/sanpham?page=1&limit=10
GET http://localhost:3000/api/sanpham/tim-kiem?keyword=iphone&minRating=4
GET http://localhost:3000/api/sanpham/SP001?include=hinhanh,danhgia
GET http://localhost:3000/api/sanpham/cua-hang/CH001

👉 PROTECTED ROUTES (cần token):
POST http://localhost:3000/api/sanpham/tao-moi
Header: Authorization: Bearer {token}
Body: {
  "TenSP": "iPhone 15 Pro Max",
  "MoTa": "Điện thoại flagship của Apple",
  "GiaBan": 29990000,
  "SLTon": 50,
  "DVT": "Cái",
  "TrangThai": "Đang bán"
}

GET http://localhost:3000/api/sanpham/cua-hang-cua-toi/danh-sach
Header: Authorization: Bearer {token}

PUT http://localhost:3000/api/sanpham/cap-nhat/SP001
Header: Authorization: Bearer {token}
Body: {
  "GiaBan": 28990000,
  "SLTon": 45
}

DELETE http://localhost:3000/api/sanpham/xoa/SP001
Header: Authorization: Bearer {token}
*/
