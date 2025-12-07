// src/config/upload.js
import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const rootDir = process.cwd(); // Lấy thư mục gốc dự án

    // 🟢 LOGIC TỰ ĐỘNG CHỌN THƯ MỤC
    let folder = "others";

    // Nếu API URL có chứa chữ "avatar" hoặc field name là "avatar"
    if (req.originalUrl.includes("avatar") || file.fieldname === "avatar") {
      folder = "avatars";
    }
    // Nếu API URL có chứa "sanpham", "product" hoặc field name là "images", "hinhAnh"
    else if (
      req.originalUrl.includes("sanpham") ||
      req.originalUrl.includes("product") ||
      file.fieldname === "images"
    ) {
      folder = "products";
    }
    // Nếu API URL có chứa "delivery" hoặc fieldname là proof -> lưu vào deliveries
    else if (
      req.originalUrl.includes("delivery") ||
      req.originalUrl.includes("giaohang") ||
      file.fieldname === "proof"
    ) {
      folder = "deliveries";
    }

    // Tạo đường dẫn vật lý: public/uploads/avatars HOẶC public/uploads/products
    const uploadPath = path.join(rootDir, "public", "uploads", folder);

    // Tạo thư mục nếu chưa có
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    // Gán biến folder vào req để Controller biết ảnh đã chui vào đâu
    req.savedFolder = folder;

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default upload;
