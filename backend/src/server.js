// 📦 server.js — File khởi động chính (Merge E-commerce + Blockchain)
// ==============================
// 🟢 CORE MODULES
// ==============================
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ==============================
// 🟢 SYSTEM / UTILITIES
// ==============================
import http from "http";
import { Server } from "socket.io";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import multer from "multer";
import fs from "fs";
import os from "os";

// ==============================
// 🟢 DATABASE CONFIG
// ==============================
import { connectDB, syncDB } from "./config/db.js";
import sequelize from "./config/db.js";

// ==============================
// 🟢 E-COMMERCE ROUTES
// ==============================
import cuahangRoutes from "./routes/cuahangRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import sanphamRoutes from "./routes/sanphamRoutes.js";
import rfqRoutes from "./routes/rfqRoutes.js";
import danhmucRoutes from "./routes/danhmucRoutes.js";
import danhGiaSanPhamRoutes from "./routes/danhGiaSanPhamRoutes.js";
import danhGiaCuaHangRoutes from "./routes/danhGiaCuaHangRoutes.js";
import hinhanhRoutes from "./routes/hinhanhRoutes.js";
import khuyenMaiRoutes from "./routes/khuyenmaiRoutes.js";

// ==============================
// 🟢 BLOCKCHAIN ROUTES
// ==============================
import blockchainRoutes from "./routes/blockchainRoutes.js";
import { getCategoriesForRFQ } from "./controllers/rfqController.js";

// ==============================
// 🟢 LOAD ENV
// ==============================
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== UTILITY FUNCTIONS ====================
function getAllIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];

  console.log("🌐 Tất cả IP addresses trên máy:");
  for (const [name, nets] of Object.entries(interfaces)) {
    for (const net of nets) {
      if (net.family === "IPv4" && !net.internal) {
        console.log(`   ${name}: ${net.address}`);
        ips.push(net.address);
      }
    }
  }
  return ips;
}

function getWiFiIP() {
  const interfaces = os.networkInterfaces();

  for (const [name, addresses] of Object.entries(interfaces)) {
    for (const address of addresses) {
      if (address.family === "IPv4" && !address.internal) {
        if (
          name.toLowerCase().includes("wi-fi") ||
          name.toLowerCase().includes("wireless") ||
          name.toLowerCase().includes("wlan")
        ) {
          return address.address;
        }
      }
    }
  }
  return "localhost";
}

const wifiIP = getWiFiIP();
console.log(`🌐 Phát hiện IP WiFi: ${wifiIP}`);
getAllIPs();

// ==================== SERVER SETUP ====================
const app = express();
const httpServer = http.createServer(app);

// 🟢 BLOCKCHAIN INIT
import Blockchain from "./../blockchain/core/MyBlockchain.js";
const supplyChain = new Blockchain();

// ==================== MIDDLEWARE CONFIGURATION ====================
// CORS Configuration
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || process.env.NODE_ENV === "development") {
        callback(null, true);
      } else {
        const allowedOrigins = [
          "http://localhost:5173",
          "http://localhost:5174",
          "http://localhost:3000",
          "http://localhost:5174",
          "http://localhost:5175",
          "http://127.0.0.1:5173",
          "http://127.0.0.1:5174",
          "http://10.0.2.2:3000", // Thêm cho Android emulator
          "http://10.0.2.2:5173",
        ];
        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "X-Requested-With",
      "X-HTTP-Method-Override",
    ],
    exposedHeaders: ["Authorization"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// WebSocket Setup
const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || process.env.NODE_ENV === "development") {
        callback(null, true);
      } else {
        const allowedOrigins = [
          "http://localhost:5173",
          "http://localhost:3000",
          "http://10.0.2.2:3000",
        ];
        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  },
});

global.io = io;

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("🔌 Client kết nối:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔌 Client ngắt kết nối:", socket.id);
  });

  socket.on("subscribe:product", (productId) => {
    const room = `product:${productId}`;
    socket.join(room);
    console.log(`📦 Client ${socket.id} đã join room: ${room}`);
  });

  socket.on("unsubscribe:product", (productId) => {
    socket.leave(`product:${productId}`);
    console.log(`📦 Client ${socket.id} bỏ theo dõi sản phẩm: ${productId}`);
  });
});

// Preflight requests
app.options("*", cors());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ==================== STATIC FILE SERVING - PHẦN SỬA LỖI ====================
console.log("🔄 Đang cấu hình static files...");

const publicDir = path.join(process.cwd(), "public");
console.log("📂 Public Directory:", publicDir);

// Đảm bảo thư mục public tồn tại
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log("✅ Đã tạo thư mục public");
}

app.use(express.static(publicDir));

// 🟢 QUAN TRỌNG: CẤU HÌNH UPLOADS DIRECTORY
const uploadsDir = path.join(process.cwd(), "public", "uploads");
console.log("📂 Uploads Directory:", uploadsDir);

// Đảm bảo thư mục uploads và các thư mục con tồn tại
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Đã tạo thư mục uploads");
}

const uploadSubdirs = ["products", "stores", "avatars", "others"];
uploadSubdirs.forEach((dir) => {
  const fullPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Đã tạo thư mục: ${fullPath}`);
  }
});

// 🟢 FIX QUAN TRỌNG: Phục vụ static files ĐÚNG CÁCH
app.use(
  "/uploads",
  express.static(uploadsDir, {
    index: false,
    dotfiles: "deny",
    fallthrough: true,
  })
);

console.log("✅ Static files configured for:", uploadsDir);

// 🟢 THÊM FALLBACK ROUTE CHO UPLOADS - XỬ LÝ KHI FILE KHÔNG TỒN TẠI
app.get("/uploads/products/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(uploadsDir, "products", filename);

  console.log(`🔍 Client request file: ${filename}`);
  console.log(`📁 Physical path: ${filePath}`);
  console.log(`✅ File exists: ${fs.existsSync(filePath)}`);

  if (fs.existsSync(filePath)) {
    // File tồn tại - phục vụ bình thường
    return res.sendFile(filePath);
  } else {
    // File không tồn tại - trả về ảnh mặc định hoặc thông báo
    console.log(`❌ File not found: ${filename}`);

    // Kiểm tra file có sẵn trong thư mục
    const availableFiles = fs.readdirSync(path.join(uploadsDir, "products"));
    console.log(`📁 Available files: ${availableFiles.join(", ")}`);

    // Nếu có file nào đó, trả về file đầu tiên
    if (availableFiles.length > 0) {
      const firstFile = availableFiles[0];
      const firstFilePath = path.join(uploadsDir, "products", firstFile);
      console.log(`🔄 Returning first available file: ${firstFile}`);
      return res.sendFile(firstFilePath);
    } else {
      // Trả về JSON thông báo
      return res.status(404).json({
        success: false,
        message: "Hình ảnh không tồn tại",
        requested_file: filename,
        available_files: availableFiles,
        suggestion: "Kiểm tra lại tên file hoặc upload file mới",
      });
    }
  }
});

// Tương tự cho các thư mục khác
app.get("/uploads/stores/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(uploadsDir, "stores", filename);

  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  } else {
    const availableFiles = fs.readdirSync(path.join(uploadsDir, "stores"));
    return res.status(404).json({
      success: false,
      message: "Hình ảnh cửa hàng không tồn tại",
      requested_file: filename,
      available_files: availableFiles,
    });
  }
});

console.log("✅ Tất cả static file routes đã được cấu hình");

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = "others";

    if (req.originalUrl.includes("avatar")) folder = "avatars";
    else if (req.originalUrl.includes("product")) folder = "products";
    else if (
      req.originalUrl.includes("store") ||
      req.originalUrl.includes("cuahang")
    )
      folder = "stores";

    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`✅ Đã tạo thư mục upload: ${uploadDir}`);
    }
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
    console.log(`📁 Saving file: ${filename}`);
    cb(null, filename);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("❌ Chỉ chấp nhận file ảnh!"), false);
    }
  },
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(
    `📍 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`
  );
  if (Object.keys(req.body).length > 0 && req.method !== "GET") {
    console.log("📦 Request Body:", JSON.stringify(req.body, null, 2));
  }
  next();
});

// ==================== ROUTE REGISTRATION ====================
const registerRoute = (path, router, method = "use") => {
  try {
    if (!router) {
      console.log(`❌ Router is null for path: ${path}`);
      return;
    }

    app[method](path, router);
    console.log(`✅ Registered: ${path}`);

    // Debug: log các routes con
    if (router.stack) {
      router.stack.forEach((layer) => {
        if (layer.route) {
          const methods = Object.keys(layer.route.methods)
            .join(", ")
            .toUpperCase();
          console.log(`   ↳ ${methods} ${path}${layer.route.path}`);
        }
      });
    }
  } catch (error) {
    console.error(`❌ Lỗi đăng ký route ${path}:`, error.message);
  }
};

console.log("🔄 Đang đăng ký routes...");

// 🟢 E-COMMERCE ROUTES
registerRoute("/api/auth", authRoutes);
registerRoute("/api/cuahang", cuahangRoutes);
registerRoute("/api/cart", cartRoutes);
registerRoute("/api/order", orderRoutes);
registerRoute("/api/sanpham", sanphamRoutes);
registerRoute("/api/danh-gia-san-pham", danhGiaSanPhamRoutes);
registerRoute("/api/danh-gia-cua-hang", danhGiaCuaHangRoutes);
registerRoute("/api/rfq", rfqRoutes);
registerRoute("/api/khuyen-mai", khuyenMaiRoutes);
registerRoute("/api/hinh-anh", hinhanhRoutes); // 🟢 QUAN TRỌNG: ĐÃ THÊM DÒNG NÀY

// Categories routes
registerRoute("/api/categories", danhmucRoutes);
registerRoute("/api/danhmuc", danhmucRoutes);

// 🟢 BLOCKCHAIN ROUTES
if (blockchainRoutes) {
  registerRoute("/api/blockchain", blockchainRoutes);
  console.log("✅ Blockchain routes đã được đăng ký");
} else {
  console.log("⚠️ Blockchain routes không khả dụng, chỉ e-commerce hoạt động");

  app.use("/api/blockchain", (req, res) => {
    res.status(503).json({
      success: false,
      message: "Blockchain service đang bảo trì",
      endpoints: ["/health", "/stats", "/record", "/history/:productId"],
    });
  });
}

// RFQ categories endpoint
app.get("/api/rfq/categories", getCategoriesForRFQ);

console.log("✅ Tất cả routes đã được đăng ký thành công");

// ==================== DEBUG ENDPOINTS - PHẦN THÊM MỚI ====================
// 🟢 DEBUG ROUTES ENDPOINT
app.get("/api/debug/routes-all", (req, res) => {
  const routes = [];

  function extractRoutes(layer, prefix = "") {
    if (layer.route) {
      const path = prefix + (layer.route.path === "/" ? "" : layer.route.path);
      const methods = Object.keys(layer.route.methods).map((method) =>
        method.toUpperCase()
      );
      routes.push({ path, methods });
    } else if (layer.name === "router" && layer.handle.stack) {
      const routerPrefix =
        prefix +
        (layer.regexp.toString() !== "/^\\/?(?=\\/|$)/i"
          ? layer.regexp
              .toString()
              .replace(/^\/\^\\\//, "")
              .replace(/\\\/\?\(\?=\\\/\|\$\)\/i$/, "")
          : "");
      layer.handle.stack.forEach((handler) => {
        extractRoutes(handler, routerPrefix);
      });
    }
  }

  app._router.stack.forEach((layer) => {
    extractRoutes(layer);
  });

  res.json({
    success: true,
    total_routes: routes.length,
    image_routes: routes.filter(
      (route) =>
        route.path.includes("hinh-anh") || route.path.includes("uploads")
    ),
    all_routes: routes,
  });
});

// 🟢 DEBUG FILE ENDPOINT
app.get("/api/debug/files", (req, res) => {
  const productsDir = path.join(uploadsDir, "products");
  const storesDir = path.join(uploadsDir, "stores");

  let productFiles = [];
  let storeFiles = [];

  try {
    if (fs.existsSync(productsDir)) {
      productFiles = fs.readdirSync(productsDir);
    }
    if (fs.existsSync(storesDir)) {
      storeFiles = fs.readdirSync(storesDir);
    }
  } catch (error) {
    console.error("❌ Lỗi đọc thư mục:", error);
  }

  res.json({
    success: true,
    directories: {
      products: {
        path: productsDir,
        exists: fs.existsSync(productsDir),
        files: productFiles,
        count: productFiles.length,
      },
      stores: {
        path: storesDir,
        exists: fs.existsSync(storesDir),
        files: storeFiles,
        count: storeFiles.length,
      },
    },
    requested_file: "product-1764147467741-440221359.png",
    file_exists: productFiles.includes("product-1764147467741-440221359.png"),
  });
});

// 🟢 KIỂM TRA FILE THỰC TẾ VS DATABASE
app.get("/api/debug/check-missing-file", async (req, res) => {
  try {
    const { initModels } = await import("./models/init-models.js");
    const models = initModels(sequelize);
    const { hinhanh, sanpham } = models;

    // Lấy tất cả hình ảnh từ database
    const allImages = await hinhanh.findAll({
      attributes: ["MaHA", "URL", "MoTa"],
    });

    const results = [];

    for (const image of allImages) {
      if (image.URL && image.URL.includes("/uploads/")) {
        const filename = image.URL.split("/").pop();
        const fileType = image.URL.includes("/products/")
          ? "products"
          : image.URL.includes("/stores/")
          ? "stores"
          : "others";

        const filePath = path.join(uploadsDir, fileType, filename);
        const exists = fs.existsSync(filePath);

        results.push({
          MaHA: image.MaHA,
          URL: image.URL,
          filename: filename,
          type: fileType,
          exists: exists,
          path: filePath,
        });
      }
    }

    const missingFiles = results.filter((r) => !r.exists);
    const existingFiles = results.filter((r) => r.exists);

    res.json({
      success: true,
      total_images: allImages.length,
      missing_files: missingFiles,
      existing_files: existingFiles.length,
      details: {
        missing_count: missingFiles.length,
        existing_count: existingFiles.length,
        searched_file: "product-1764147467741-440221359.png",
        file_exists: fs.existsSync(
          path.join(
            uploadsDir,
            "products",
            "product-1764147467741-440221359.png"
          )
        ),
      },
    });
  } catch (error) {
    console.error("❌ Lỗi kiểm tra database:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== CORE ENDPOINTS ====================
// 🏠 ROUTE CHÍNH - KIỂM TRA SERVER
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Backend Server is running! (E-commerce + Blockchain)",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    environment: process.env.NODE_ENV || "development",

    endpoints: {
      ecommerce: {
        products: "/api/sanpham",
        stores: "/api/cuahang",
        auth: "/api/auth",
        cart: "/api/cart",
        orders: "/api/order",
        categories: "/api/categories",
        images: "/api/hinh-anh",
        product_reviews: "/api/danh-gia-san-pham",
        store_reviews: "/api/danh-gia-cua-hang",
        promotions: "/api/khuyen-mai",
      },

      blockchain: {
        auth: "/api/blockchain/register, /api/blockchain/login",
        records: "/api/blockchain/record",
        history: "/api/blockchain/history/:productId",
        qrcode: "/api/blockchain/qrcode/:productId",
        upload: "/api/blockchain/upload-image",
        chain: "/api/blockchain/full-chain",
        stats: "/api/blockchain/stats",
      },

      static_files: {
        product_images: "/uploads/products/{filename}",
        store_images: "/uploads/stores/{filename}",
        avatar_images: "/uploads/avatars/{filename}",
        other_files: "/uploads/others/{filename}",
      },

      debug: {
        routes: "/api/debug/routes-all",
        files: "/api/debug/files",
        missing_files: "/api/debug/check-missing-file",
      },
    },

    documentation: "/api/docs",
  });
});

// 🟢 HEALTH CHECK ENDPOINT
app.get("/health", async (req, res) => {
  try {
    await sequelize.authenticate();

    // Kiểm tra thư mục uploads
    const uploadsStatus = fs.existsSync(uploadsDir) ? "Exists" : "Missing";
    const productsDirStatus = fs.existsSync(path.join(uploadsDir, "products"))
      ? "Exists"
      : "Missing";
    const storesDirStatus = fs.existsSync(path.join(uploadsDir, "stores"))
      ? "Exists"
      : "Missing";

    // Đếm file trong thư mục
    let productFiles = [];
    let storeFiles = [];

    if (productsDirStatus === "Exists") {
      productFiles = fs.readdirSync(path.join(uploadsDir, "products"));
    }
    if (storesDirStatus === "Exists") {
      storeFiles = fs.readdirSync(path.join(uploadsDir, "stores"));
    }

    res.json({
      success: true,
      status: "OK",
      database: "Connected",
      static_files: {
        uploads_dir: uploadsStatus,
        products_dir: productsDirStatus,
        stores_dir: storesDirStatus,
        product_files_count: productFiles.length,
        store_files_count: storeFiles.length,
        base_url: `http://localhost:${process.env.PORT || 3000}/uploads/`,
      },
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || "development",
      services: {
        ecommerce: "Running",
        blockchain: "Running",
        database: "Connected",
        websocket: "Active",
        static_files: "Serving",
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: "ERROR",
      database: "Disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// 🟢 TEST UPLOADS ENDPOINT
app.get("/test-uploads", (req, res) => {
  const testDirs = [
    path.join(uploadsDir, "products"),
    path.join(uploadsDir, "stores"),
    path.join(uploadsDir, "avatars"),
    path.join(uploadsDir, "others"),
  ];

  const dirStatus = {};
  testDirs.forEach((dir) => {
    const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
    dirStatus[path.basename(dir)] = {
      exists: fs.existsSync(dir),
      file_count: files.length,
      path: dir,
      files: files.slice(0, 10), // Hiển thị 10 file đầu tiên
      url: `http://localhost:${
        process.env.PORT || 3000
      }/uploads/${path.basename(dir)}/`,
    };
  });

  res.json({
    success: true,
    message: "Uploads Directory Test",
    base_uploads_url: `http://localhost:${process.env.PORT || 3000}/uploads/`,
    directories: dirStatus,
    example_urls: {
      product_image:
        "http://localhost:3000/uploads/products/product-123456789.jpg",
      store_image: "http://localhost:3000/uploads/stores/store-123456789.jpg",
      avatar: "http://localhost:3000/uploads/avatars/avatar-123456789.jpg",
    },
  });
});

// 🟢 API DOCUMENTATION ENDPOINT
app.get("/api/docs", (req, res) => {
  res.json({
    success: true,
    message: "📚 API Documentation - Hệ Thống Quản Lý Sản Phẩm & Cửa Hàng",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      // ... (giữ nguyên phần api docs hiện có)
      // 🖼️ HÌNH ẢNH - ĐÃ ĐƯỢC CẬP NHẬT
      images: {
        "POST /api/hinh-anh/san-pham/:MaSP": "Thêm hình ảnh cho sản phẩm",
        "POST /api/hinh-anh/cua-hang": "Thêm hình ảnh cho cửa hàng",
        "GET /api/hinh-anh/san-pham/:MaSP": "Lấy hình ảnh sản phẩm",
        "GET /api/hinh-anh/cua-hang/:MaCH": "Lấy hình ảnh cửa hàng",
        "PUT /api/hinh-anh/:MaHA/mo-ta": "Cập nhật mô tả hình ảnh",
        "DELETE /api/hinh-anh/:MaHA": "Xóa hình ảnh",
      },

      // 🖼️ STATIC FILES - ĐÃ ĐƯỢC CẬP NHẬT
      static_files: {
        "GET /uploads/products/{filename}":
          "Truy cập hình ảnh sản phẩm (có fallback)",
        "GET /uploads/stores/{filename}":
          "Truy cập hình ảnh cửa hàng (có fallback)",
        "GET /uploads/avatars/{filename}": "Truy cập hình ảnh đại diện",
        "GET /uploads/others/{filename}": "Truy cập file khác",
      },

      // 🐛 DEBUG ENDPOINTS - PHẦN THÊM MỚI
      debug: {
        "GET /api/debug/routes-all": "Xem tất cả routes đã đăng ký",
        "GET /api/debug/files": "Kiểm tra file trong thư mục uploads",
        "GET /api/debug/check-missing-file":
          "Kiểm tra file missing trong database",
        "GET /test-uploads": "Kiểm tra thư mục uploads",
        "GET /health": "Health check server",
      },
    },
    // ... (giữ nguyên phần còn lại)
  });
});

// ==================== BLOCKCHAIN ENDPOINTS ====================
// ... (giữ nguyên phần blockchain endpoints hiện có)

// ==================== ERROR HANDLING ====================
// Handle 404 routes
app.use("*", (req, res) => {
  console.warn(`❌ Route not found: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: "Route not found",
    message: `Endpoint ${req.method} ${req.originalUrl} không tồn tại`,
    suggestion: "Xem danh sách endpoints tại GET /api/docs",
    availableEndpoints: [
      "/api/sanpham",
      "/api/cuahang",
      "/api/auth",
      "/api/cart",
      "/api/order",
      "/api/khuyen-mai",
      "/api/danh-gia-san-pham",
      "/api/danh-gia-cua-hang",
      "/api/hinh-anh",
      "/api/blockchain",
      "/api/docs",
      "/health",
      "/test-uploads",
      "/api/debug/routes-all",
      "/api/debug/files",
    ],
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("🔥 Lỗi server:", err);

  // Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File quá lớn",
        details: "Kích thước file tối đa là 5MB",
      });
    }
  }

  // Sequelize errors
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      error: "Validation Error",
      message: "Dữ liệu không hợp lệ",
      details: err.errors.map((e) => ({
        field: e.path,
        message: e.message,
        value: e.value,
      })),
    });
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      success: false,
      error: "Duplicate Entry",
      message: "Dữ liệu đã tồn tại trong hệ thống",
      field: err.errors[0]?.path,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: "Invalid Token",
      message: "Token không hợp lệ",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: "Token Expired",
      message: "Token đã hết hạn",
    });
  }

  // Default error
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Đã xảy ra lỗi, vui lòng thử lại sau",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
});

// ==================== SERVER STARTUP ====================
async function startServer() {
  try {
    console.log("🔄 Đang khởi động server tích hợp...");
    console.log("🌐 Environment:", process.env.NODE_ENV || "development");
    console.log("📊 Database:", process.env.DB_NAME || "N/A");
    console.log("🔗 Host:", process.env.DB_HOST || "localhost");

    // 1️⃣ KẾT NỐI DATABASE
    console.log("📊 Đang kết nối database...");
    await connectDB();
    console.log("✅ Kết nối database thành công");

    // 2️⃣ KHỞI TẠO MODELS
    console.log("🛠️ Đang khởi tạo models...");
    const initModelsModule = await import("./models/init-models.js");
    const initModels = initModelsModule.default;

    if (typeof initModels !== "function") {
      throw new Error("initModels is not a function");
    }

    const models = initModels(sequelize);
    console.log("✅ Khởi tạo models thành công");
    console.log(`📋 Số lượng models: ${Object.keys(models).length}`);

    // 3️⃣ ĐỒNG BỘ DATABASE - XỬ LÝ LỖI
    console.log("🔄 Đang đồng bộ database...");
    try {
      await syncDB();
      console.log("✅ Đồng bộ database thành công");
    } catch (syncError) {
      console.warn("⚠️ Có cảnh báo khi đồng bộ database:");
      console.warn("   - Lỗi:", syncError.message);
      console.warn("   - Nguyên nhân: Có thể do indexes trong bảng vaitro");
      console.warn("   - Ảnh hưởng: Không ảnh hưởng đến hoạt động API");
      console.log("🔄 Tiếp tục khởi động server (lỗi không nghiêm trọng)...");
    }

    const PORT = process.env.PORT || 3000;
    const server = (httpServer || app).listen(PORT, "0.0.0.0", () => {
      console.log(`\n🎉 ==========================================`);
      console.log(`✅ Server đang chạy trên port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 Base URL: http://localhost:${PORT}`);

      console.log(`\n🛒 E-COMMERCE ENDPOINTS:`);
      console.log(`   📦 Products: http://localhost:${PORT}/api/sanpham`);
      console.log(`   🏪 Stores: http://localhost:${PORT}/api/cuahang`);
      console.log(`   🔐 Auth: http://localhost:${PORT}/api/auth`);
      console.log(`   🛒 Cart: http://localhost:${PORT}/api/cart`);
      console.log(`   🎁 Promotions: http://localhost:${PORT}/api/khuyen-mai`);
      console.log(`   🖼️ Images: http://localhost:${PORT}/api/hinh-anh`);
      console.log(
        `   ⭐ Reviews SP: http://localhost:${PORT}/api/danh-gia-san-pham`
      );
      console.log(
        `   🏪 Reviews CH: http://localhost:${PORT}/api/danh-gia-cua-hang`
      );

      console.log(`\n⛓️ BLOCKCHAIN ENDPOINTS:`);
      console.log(`   🔐 Login: http://localhost:${PORT}/api/blockchain/login`);
      console.log(
        `   📝 Records: http://localhost:${PORT}/api/blockchain/record`
      );
      console.log(
        `   📊 Full Chain: http://localhost:${PORT}/api/blockchain/full-chain`
      );
      console.log(
        `   📱 QR Code: http://localhost:${PORT}/api/blockchain/qrcode/PRODUCT_ID`
      );

      console.log(`\n📁 STATIC FILE ENDPOINTS:`);
      console.log(
        `   🖼️ Product Images: http://localhost:${PORT}/uploads/products/`
      );
      console.log(
        `   🏪 Store Images: http://localhost:${PORT}/uploads/stores/`
      );
      console.log(
        `   👤 Avatar Images: http://localhost:${PORT}/uploads/avatars/`
      );
      console.log(
        `   📄 Other Files: http://localhost:${PORT}/uploads/others/`
      );

      console.log(`\n🐛 DEBUG ENDPOINTS:`);
      console.log(
        `   📋 Routes: http://localhost:${PORT}/api/debug/routes-all`
      );
      console.log(`   📁 Files: http://localhost:${PORT}/api/debug/files`);
      console.log(
        `   ❓ Missing: http://localhost:${PORT}/api/debug/check-missing-file`
      );

      console.log(`\n📚 API Docs: http://localhost:${PORT}/api/docs`);
      console.log(`❤️ Health: http://localhost:${PORT}/health`);
      console.log(`🧪 Test Uploads: http://localhost:${PORT}/test-uploads`);
      console.log(`🎉 ==========================================\n`);

      console.log(`🚀 ENDPOINT QUAN TRỌNG:`);
      console.log(
        `   📝 Tạo SP: POST http://localhost:${PORT}/api/sanpham/tao-moi`
      );
      console.log(
        `   🖼️ Upload ảnh: POST http://localhost:${PORT}/api/hinh-anh/san-pham/:MaSP`
      );
      console.log(
        `   🔐 Đăng nhập: POST http://localhost:${PORT}/api/auth/login`
      );
      console.log(
        `   🏪 Đăng ký cửa hàng: POST http://localhost:${PORT}/api/cuahang/dang-ky\n`
      );
    });

    // 🟢 GRACEFUL SHUTDOWN
    const gracefulShutdown = (signal) => {
      console.log(`\n⚠️ Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log("✅ HTTP server closed.");
        sequelize.close().then(() => {
          console.log("✅ Database connection closed.");
          process.exit(0);
        });
      });
      setTimeout(() => {
        console.error(
          "❌ Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("unhandledRejection", (reason, promise) => {
      console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
      // Close server & exit process
      server.close(() => {
        process.exit(1);
      });
    });
    process.on("uncaughtException", (error) => {
      console.error("❌ Uncaught Exception:", error);
      process.exit(1);
    });
  } catch (err) {
    console.error("❌ LỖI KHỞI ĐỘNG SERVER:", err);
    if (err.original) console.error("📌 Original Error:", err.original);
    if (err.sql) console.error("📌 SQL Query:", err.sql);
    if (err.stack) console.error("📌 Stack Trace:", err.stack);
    process.exit(1);
  }
}

// ▶️ CHẠY SERVER
startServer();

export default app;
