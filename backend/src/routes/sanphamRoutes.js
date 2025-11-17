// routes/sanphamRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  getAllSanpham,
  getSanphamById,
  getSanphamByCuaHang,
  createSanpham,
  updateSanpham,
  deleteSanpham,
  getMySanpham,
  searchSanpham,
  getCategoriesWithCount,
  getProductStats,
} from "../controllers/sanphamController.js";

const router = express.Router();

// 🟢 ĐẢM BẢO THƯ MỤC UPLOAD TỒN TẠI
const ensureUploadDir = () => {
  const uploadDir = path.join(process.cwd(), "uploads", "products");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// 🟢 CẤU HÌNH MULTER ĐỂ UPLOAD FILE
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = ensureUploadDir();
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExt = path.extname(file.originalname);
    cb(null, "product-" + uniqueSuffix + fileExt);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file hình ảnh!"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// ======================================
// 🟢 PUBLIC ROUTES - KHÔNG CẦN ĐĂNG NHẬP
// ======================================

// 🔍 Lấy danh sách tất cả sản phẩm (có phân trang, tìm kiếm, lọc)
// GET /api/sanpham?page=1&limit=10&search=iphone&minPrice=1000000&maxPrice=5000000&minRating=4&danhMuc=DM001&sortBy=newest
router.get("/", getAllSanpham);

// 🔍 Tìm kiếm sản phẩm nâng cao
// GET /api/sanpham/tim-kiem?keyword=iphone&minPrice=1000000&minRating=4&MaCH=CH001
router.get("/tim-kiem", searchSanpham);

// 🏷️ Lấy danh mục với số lượng sản phẩm
// GET /api/sanpham/danh-muc
router.get("/danh-muc", getCategoriesWithCount);

// 📋 Lấy thông tin chi tiết sản phẩm theo mã
// GET /api/sanpham/SP001?include=hinhanh,danhmuc,danhgia
router.get("/:MaSP", getSanphamById);

// 🏪 Lấy sản phẩm theo cửa hàng
// GET /api/sanpham/cua-hang/CH001?page=1&limit=10&include=hinhanh
router.get("/cua-hang/:MaCH", getSanphamByCuaHang);

// ======================================
// 🔐 PROTECTED ROUTES - CẦN ĐĂNG NHẬP + CÓ CỬA HÀNG
// ======================================

// 📊 Thống kê sản phẩm của cửa hàng tôi
// GET /api/sanpham/cua-hang-cua-toi/thong-ke
router.get("/cua-hang-cua-toi/thong-ke", getProductStats);

// 📦 Lấy danh sách sản phẩm của cửa hàng tôi
// GET /api/sanpham/cua-hang-cua-toi/danh-sach?page=1&limit=10&include=hinhanh
router.get("/cua-hang-cua-toi/danh-sach", getMySanpham);

// 🆕 Thêm sản phẩm mới vào cửa hàng của tôi (CÓ UPLOAD HÌNH ẢNH)
// POST /api/sanpham/tao-moi
// Header: Authorization: Bearer {token}
// Body: FormData với file và text fields
router.post(
  "/tao-moi",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "hinhAnh", maxCount: 10 },
  ]),
  createSanpham
);

// ✏️ Cập nhật sản phẩm của cửa hàng tôi (CÓ UPLOAD HÌNH ẢNH MỚI)
// PUT /api/sanpham/cap-nhat/:MaSP
// Header: Authorization: Bearer {token}
// Body: FormData với file và text fields
router.put(
  "/cap-nhat/:MaSP",
  upload.fields([
    { name: "hinhAnhMoi", maxCount: 10 },
    { name: "images", maxCount: 10 },
  ]),
  updateSanpham
);

// 🗑️ Xóa sản phẩm của cửa hàng tôi
// DELETE /api/sanpham/xoa/:MaSP
// Header: Authorization: Bearer {token}
router.delete("/xoa/:MaSP", deleteSanpham);

// 🟢 XỬ LÝ LỖI MULTER
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Kích thước file quá lớn. Tối đa 5MB mỗi file.",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Quá nhiều file. Tối đa 10 file mỗi lần.",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Field name không hợp lệ cho upload file.",
      });
    }
  }

  if (error.message.includes("Chỉ chấp nhận file hình ảnh")) {
    return res.status(400).json({
      success: false,
      message: "Chỉ chấp nhận file hình ảnh (JPEG, PNG, GIF, WebP)",
    });
  }

  next(error);
});

// 🟢 EXPORT DEFAULT
export default router;

// 🟢 HƯỚNG DẪN SỬ DỤNG CHI TIẾT:

/*
==========================================
🎯 CÁCH SỬ DỤNG API SẢN PHẨM
==========================================

1. KHÁCH VÃNG LAI (KHÔNG CẦN TOKEN):
   -----------------------------------
   🔍 Xem danh sách sản phẩm:
   GET /api/sanpham?page=1&limit=10&search=táo&minPrice=10000&maxPrice=500000&danhMuc=DM001

   🔍 Tìm kiếm nâng cao:
   GET /api/sanpham/tim-kiem?keyword=táo nhật&minRating=4&MaCH=CH001

   🏷️ Xem danh mục:
   GET /api/sanpham/danh-muc

   📋 Xem chi tiết sản phẩm:
   GET /api/sanpham/SP001?include=hinhanh,danhmuc,danhgia

   🏪 Xem sản phẩm theo cửa hàng:
   GET /api/sanpham/cua-hang/CH001?page=1&limit=20

2. CHỦ CỬA HÀNG (CẦN TOKEN):
   --------------------------
   📊 THỐNG KÊ SẢN PHẨM:
   --------------------
   GET /api/sanpham/cua-hang-cua-toi/thong-ke
   Headers: Authorization: Bearer {token}

   📦 XEM SẢN PHẨM CỦA TÔI:
   ------------------------
   GET /api/sanpham/cua-hang-cua-toi/danh-sach?page=1&limit=10&include=hinhanh
   Headers: Authorization: Bearer {token}

   🆕 THÊM SẢN PHẨM MỚI:
   --------------------
   POST /api/sanpham/tao-moi
   Headers: 
     - Authorization: Bearer {token}
     - Content-Type: multipart/form-data

   Body (FormData):
     - TenSP: "Táo Fuji Nhật Bản" (required)
     - MoTa: "Táo nhập khẩu từ Nhật Bản" (optional)
     - GiaBan: 120000 (required)
     - SLTon: 50 (required)
     - DVT: "kg" (optional)
     - NguonGoc: "Nhật Bản" (optional)
     - TrangThai: "Đang bán" (optional)
     - danhMucIds: ["DM001", "DM003"] (optional - array)
     - images: [file1, file2, ...] (optional - max 10 files)
     - hinhAnh: [file1, file2, ...] (optional - max 10 files)

   ✏️ CẬP NHẬT SẢN PHẨM:
   ---------------------
   PUT /api/sanpham/cap-nhat/SP001
   Headers:
     - Authorization: Bearer {token}
     - Content-Type: multipart/form-data

   Body (FormData):
     - TenSP: "Táo Fuji Premium" (optional)
     - GiaBan: 150000 (optional)
     - SLTon: 30 (optional)
     - danhMucIds: ["DM001", "DM005"] (optional - array)
     - xoaHinhAnhIds: ["HA001", "HA002"] (optional - array of MaHA to delete)
     - hinhAnhMoi: [file1, file2, ...] (optional - max 10 new files)
     - images: [file1, file2, ...] (optional - max 10 new files)

   🗑️ XÓA SẢN PHẨM:
   ----------------
   DELETE /api/sanpham/xoa/SP001
   Headers: Authorization: Bearer {token}

==========================================
🎯 VÍ DỤ TEST TRONG POSTMAN
==========================================

👉 PUBLIC ROUTES (không cần token):
-----------------------------------
GET http://localhost:3000/api/sanpham?page=1&limit=10
GET http://localhost:3000/api/sanpham/tim-kiem?keyword=táo&minRating=4
GET http://localhost:3000/api/sanpham/danh-muc
GET http://localhost:3000/api/sanpham/SP001?include=hinhanh,danhmuc
GET http://localhost:3000/api/sanpham/cua-hang/CH001

👉 PROTECTED ROUTES (cần token):
--------------------------------
📊 THỐNG KÊ:
Method: GET
URL: http://localhost:3000/api/sanpham/cua-hang-cua-toi/thong-ke
Headers: Authorization: Bearer {token}

📦 SẢN PHẨM CỦA TÔI:
Method: GET
URL: http://localhost:3000/api/sanpham/cua-hang-cua-toi/danh-sach?include=hinhanh
Headers: Authorization: Bearer {token}

🆕 THÊM SẢN PHẨM:
Method: POST
URL: http://localhost:3000/api/sanpham/tao-moi
Headers: 
  - Authorization: Bearer {token}
  - Content-Type: multipart/form-data

Body (form-data):
  Key: TenSP (text) → Value: "Táo Fuji Nhật Bản"
  Key: MoTa (text) → Value: "Táo nhập khẩu chất lượng cao"
  Key: GiaBan (text) → Value: "120000"
  Key: SLTon (text) → Value: "50"
  Key: DVT (text) → Value: "kg"
  Key: danhMucIds (text) → Value: ["DM001", "DM003"]
  Key: images (file) → Chọn file hình ảnh (có thể chọn nhiều)

✏️ CẬP NHẬT SẢN PHẨM:
Method: PUT
URL: http://localhost:3000/api/sanpham/cap-nhat/SP001
Headers:
  - Authorization: Bearer {token}
  - Content-Type: multipart/form-data

Body (form-data):
  Key: TenSP (text) → Value: "Táo Fuji Premium"
  Key: GiaBan (text) → Value: "150000"
  Key: danhMucIds (text) → Value: ["DM001", "DM005"]
  Key: xoaHinhAnhIds (text) → Value: ["HA001", "HA002"]
  Key: hinhAnhMoi (file) → Chọn file hình ảnh mới

🗑️ XÓA SẢN PHẨM:
Method: DELETE
URL: http://localhost:3000/api/sanpham/xoa/SP001
Headers: Authorization: Bearer {token}

==========================================
🎯 LƯU Ý QUAN TRỌNG
==========================================

✅ Đảm bảo thư mục 'uploads/products/' tồn tại
✅ File ảnh tối đa 5MB, chỉ chấp nhận định dạng ảnh
✅ Tối đa 10 ảnh cho mỗi lần thêm/cập nhật
✅ Hỗ trợ cả field name 'images' và 'hinhAnh' cho tương thích
✅ Danh mục có thể để trống hoặc gửi mảng rỗng để xóa tất cả
✅ Hình ảnh mới sẽ được thêm vào, hình ảnh cũ có thể xóa bằng MaHA
✅ Luôn sử dụng FormData khi gửi request có file
*/
