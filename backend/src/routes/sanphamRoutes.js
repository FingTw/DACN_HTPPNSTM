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
  const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
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
