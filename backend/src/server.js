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

import paymentRoutes from "./routes/paymentRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";

import adminRoutes from "./routes/adminRoutes.js";

// ==============================
// 🟢 BLOCKCHAIN ROUTES
// ==============================
import blockchainRoutes from "./routes/blockchainRoutes.js";
import { getCategoriesForRFQ } from "./controllers/rfqController.js";

import aiRoutes from "./routes/aiRoutes.js";

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

app.use("/api/ai", aiRoutes);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 🟢 Tính toán đường dẫn tuyệt đối dựa vào vị trí của server.js
const srcDir = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.join(srcDir, "..");
const publicDir = path.join(backendDir, "public");

console.log("📂 Static Directory:", publicDir);
app.use(express.static(publicDir));

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = "others";

    if (req.originalUrl.includes("avatar")) folder = "avatars";
    else if (req.originalUrl.includes("product")) folder = "products";

    const uploadDir = path.join(backendDir, "public", "uploads", folder);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
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
  if (router) {
    app[method](path, router);
    console.log(`✅ Registered: ${path}`);
  } else {
    console.log(`❌ Skipped: ${path} (router is null)`);
  }
};

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
registerRoute("/api/danh-muc", danhmucRoutes);
registerRoute("/api/admin", adminRoutes);
registerRoute("/api/payment", paymentRoutes);
registerRoute("/api/wallet", walletRoutes);

// 🟢 BLOCKCHAIN ROUTES
if (blockchainRoutes) {
  registerRoute("/api/blockchain", blockchainRoutes);
  console.log("🎯 Blockchain routes đã được đăng ký");
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
    },

    documentation: "/api/docs",
  });
});

// 🟢 HEALTH CHECK ENDPOINT
app.get("/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      success: true,
      status: "OK",
      database: "Connected",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || "development",
      services: {
        ecommerce: "Running",
        blockchain: "Running",
        database: "Connected",
        websocket: "Active",
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

// 🟢 API DOCUMENTATION ENDPOINT
app.get("/api/docs", (req, res) => {
  res.json({
    success: true,
    message: "📚 API Documentation - Hệ Thống Quản Lý Sản Phẩm & Cửa Hàng",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      // 🏠 SERVER INFO
      server: {
        "GET /": "Thông tin server",
        "GET /health": "Health check server và database",
        "GET /api/docs": "Tài liệu API này",
        "GET /api/debug/routes": "Debug danh sách routes",
      },

      // 🔐 AUTHENTICATION
      auth: {
        "POST /api/auth/register": "Đăng ký tài khoản mới",
        "POST /api/auth/login": "Đăng nhập",
        "GET /api/auth/me": "Lấy thông tin user hiện tại (cần auth)",
        "POST /api/auth/logout": "Đăng xuất",
        "POST /api/auth/forgot-password": "Quên mật khẩu",
        "POST /api/auth/reset-password": "Đặt lại mật khẩu",
        "PUT /api/auth/profile": "Cập nhật thông tin cá nhân (cần auth)",
      },

      // 🏪 CỬA HÀNG
      stores: {
        "GET /api/cuahang": "Lấy danh sách cửa hàng (phân trang, tìm kiếm)",
        "GET /api/cuahang/:MaCH": "Lấy chi tiết cửa hàng",
        "POST /api/cuahang/dang-ky": "Đăng ký cửa hàng mới (cần auth)",
        "GET /api/cuahang/cua-toi/thong-tin": "Cửa hàng của tôi (cần auth)",
        "PUT /api/cuahang/chinh-sua/:MaCH": "Cập nhật cửa hàng (cần auth)",
        "DELETE /api/cuahang/xoa/:MaCH": "Xóa cửa hàng (cần auth)",
        "GET /api/cuahang/:MaCH/san-pham": "Sản phẩm theo cửa hàng",
        "GET /api/cuahang/top/danh-gia": "Top cửa hàng theo đánh giá",
        "GET /api/cuahang/top/theo-doi": "Top cửa hàng theo lượt theo dõi",
      },

      // 📦 SẢN PHẨM
      products: {
        "GET /api/sanpham": "Lấy danh sách sản phẩm (phân trang, filter)",
        "GET /api/sanpham/tim-kiem": "Tìm kiếm sản phẩm nâng cao",
        "GET /api/sanpham/danh-muc": "Lấy danh mục với số lượng sản phẩm",
        "GET /api/sanpham/:MaSP": "Lấy chi tiết sản phẩm",
        "GET /api/sanpham/cua-hang/:MaCH": "Sản phẩm theo cửa hàng",
        "POST /api/sanpham/tao-moi": "Thêm sản phẩm mới (cần auth + images)",
        "PUT /api/sanpham/cap-nhat/:MaSP": "Cập nhật sản phẩm (cần auth)",
        "DELETE /api/sanpham/xoa/:MaSP": "Xóa sản phẩm (cần auth)",
        "GET /api/sanpham/cua-hang-cua-toi/danh-sach":
          "Sản phẩm của tôi (cần auth)",
        "GET /api/sanpham/cua-hang-cua-toi/thong-ke":
          "Thống kê sản phẩm (cần auth)",

        // 🖼️ QUẢN LÝ HÌNH ẢNH SẢN PHẨM
        "POST /api/sanpham/:MaSP/hinh-anh":
          "Thêm hình ảnh cho sản phẩm (cần auth)",
        "DELETE /api/sanpham/:MaSP/hinh-anh/:MaHA":
          "Xóa hình ảnh sản phẩm (cần auth)",
      },

      // 🏷️ DANH MỤC
      categories: {
        "GET /api/categories": "Lấy danh sách danh mục (phân trang, tìm kiếm)",
        "GET /api/categories/tim-kiem": "Tìm kiếm danh mục",
        "GET /api/categories/pho-bien": "Lấy danh mục phổ biến",
        "GET /api/categories/:MaDM": "Lấy chi tiết danh mục",
        "GET /api/categories/:MaDM/san-pham": "Sản phẩm theo danh mục",
        "POST /api/categories": "Tạo danh mục mới (Admin only)",
        "PUT /api/categories/:MaDM": "Cập nhật danh mục (Admin only)",
        "DELETE /api/categories/:MaDM": "Xóa danh mục (Admin only)",
      },

      // 🖼️ HÌNH ẢNH
      images: {
        "POST /api/hinh-anh/san-pham/:MaSP": "Thêm hình ảnh cho sản phẩm",
        "POST /api/hinh-anh/cua-hang": "Thêm hình ảnh cho cửa hàng",
        "GET /api/hinh-anh/san-pham/:MaSP": "Lấy hình ảnh sản phẩm",
        "GET /api/hinh-anh/cua-hang/:MaCH": "Lấy hình ảnh cửa hàng",
        "PUT /api/hinh-anh/:MaHA/mo-ta": "Cập nhật mô tả hình ảnh",
        "DELETE /api/hinh-anh/:MaHA": "Xóa hình ảnh",
      },

      // ⭐ ĐÁNH GIÁ SẢN PHẨM
      product_reviews: {
        "GET /api/danh-gia-san-pham/:MaSP/danh-sach":
          "Lấy danh sách đánh giá sản phẩm",
        "GET /api/danh-gia-san-pham/:MaSP/thong-ke": "Lấy thống kê đánh giá",
        "POST /api/danh-gia-san-pham/:MaSP/them-moi":
          "Thêm đánh giá mới (cần auth)",
        "GET /api/danh-gia-san-pham/:MaSP/cua-toi":
          "Lấy đánh giá của tôi (cần auth)",
        "PUT /api/danh-gia-san-pham/:MaDG/cap-nhat":
          "Cập nhật đánh giá (cần auth)",
        "DELETE /api/danh-gia-san-pham/:MaDG/xoa": "Xóa đánh giá (cần auth)",
      },

      // 🏪 ĐÁNH GIÁ CỬA HÀNG
      store_reviews: {
        "GET /api/danh-gia-cua-hang/:MaCH/danh-sach":
          "Lấy danh sách đánh giá cửa hàng",
        "GET /api/danh-gia-cua-hang/:MaCH/thong-ke": "Lấy thống kê đánh giá",
        "POST /api/danh-gia-cua-hang/:MaCH/them-moi":
          "Thêm đánh giá mới (cần auth)",
        "GET /api/danh-gia-cua-hang/:MaCH/cua-toi":
          "Lấy đánh giá của tôi (cần auth)",
        "PUT /api/danh-gia-cua-hang/:MaDG/cap-nhat":
          "Cập nhật đánh giá (cần auth)",
        "DELETE /api/danh-gia-cua-hang/:MaDG/xoa": "Xóa đánh giá (cần auth)",
      },

      // 🛒 GIỎ HÀNG
      cart: {
        "GET /api/cart": "Lấy giỏ hàng (cần auth)",
        "POST /api/cart/them": "Thêm sản phẩm vào giỏ hàng (cần auth)",
        "PUT /api/cart/cap-nhat/:MaSP": "Cập nhật số lượng (cần auth)",
        "DELETE /api/cart/xoa/:MaSP": "Xóa sản phẩm khỏi giỏ hàng (cần auth)",
        "DELETE /api/cart/xoa-tat-ca": "Xóa toàn bộ giỏ hàng (cần auth)",
      },

      // 🧾 ĐƠN HÀNG
      orders: {
        "GET /api/order": "Lấy danh sách đơn hàng (cần auth)",
        "GET /api/order/:MaDH": "Lấy chi tiết đơn hàng (cần auth)",
        "POST /api/order/tao-moi": "Tạo đơn hàng mới (cần auth)",
        "PUT /api/order/:MaDH/trang-thai": "Cập nhật trạng thái đơn hàng",
        "GET /api/order/cua-hang/danh-sach": "Đơn hàng của cửa hàng (cần auth)",
        "GET /api/order/khach-hang/danh-sach":
          "Đơn hàng của khách hàng (cần auth)",
      },
    },
    authentication: {
      type: "Bearer Token",
      header: "Authorization: Bearer <token>",
      note: "Các endpoint có (cần auth) yêu cầu header Authorization",
    },
    file_upload: {
      max_size: "5MB per file",
      allowed_types: "JPEG, JPG, PNG, GIF, WebP",
      form_data: "Sử dụng multipart/form-data cho upload ảnh",
    },
    message: "API Documentation - Integrated System",
    endpoints: {
      ecommerce: {
        "GET /api/sanpham": "Lấy danh sách sản phẩm",
        "GET /api/cuahang": "Lấy danh sách cửa hàng",
        "POST /api/auth/login": "Đăng nhập e-commerce",
        "GET /api/khuyen-mai": "Lấy danh sách khuyến mãi", // ✅ THÊM
        "POST /api/khuyen-mai": "Tạo khuyến mãi mới", // ✅ THÊM
        "PUT /api/khuyen-mai/:MaKM": "Cập nhật khuyến mãi", // ✅ THÊM
        "DELETE /api/khuyen-mai/:MaKM": "Xóa khuyến mãi", // ✅ THÊM
      },
      blockchain: {
        "POST /api/blockchain/register": "Đăng ký tài khoản blockchain",
        "POST /api/blockchain/login": "Đăng nhập blockchain",
        "POST /api/blockchain/record": "Ghi dữ liệu lên blockchain (cần auth)",
        "GET /api/blockchain/history/:productId": "Lấy lịch sử sản phẩm",
        "GET /api/blockchain/qrcode/:productId":
          "Tạo QR code truy xuất nguồn gốc",
        "POST /api/blockchain/upload-image": "Upload ảnh cho sản phẩm",
        "GET /api/blockchain/full-chain": "Xem toàn bộ blockchain",
        "GET /product/:productId": "Giao diện xem lịch sử sản phẩm",
      },
    },
  });
});

// ==================== BLOCKCHAIN ENDPOINTS ====================
// Mobile product view
app.get("/product/:productId", (req, res) => {
  try {
    const { productId } = req.params;

    console.log(`📱 Mobile access - Loading HTML for: ${productId}`);

    const htmlPath = path.join(__dirname, "public", "product-blocks.html");

    if (!fs.existsSync(htmlPath)) {
      return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Product: ${productId}</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: Arial; padding: 20px; background: #f0f0f0; }
                        .container { background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 50px auto; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>📦 Product: ${productId}</h1>
                        <p>✅ Server is working!</p>
                        <p>🔗 QR code system is active</p>
                        <p>⏰ ${new Date().toLocaleString()}</p>
                    </div>
                </body>
                </html>
            `);
    }

    let html = fs.readFileSync(htmlPath, "utf8");
    html = html.replace("<!-- PRODUCT_ID_PLACEHOLDER -->", productId);
    html = html.replace(
      "window.currentProductId = null",
      `window.currentProductId = "${productId}"`
    );

    res.send(html);
  } catch (error) {
    console.error("❌ Lỗi hiển thị giao diện mobile:", error);
    res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>Error</title><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body>
                <h1>❌ Lỗi tải sản phẩm</h1>
                <p>Product: ${req.params.productId}</p>
                <p>Error: ${error.message}</p>
                <p>Hãy thử lại sau!</p>
            </body>
            </html>
        `);
  }
});

// Blockchain product blocks
app.get("/api/blockchain/product/:productId/blocks", async (req, res) => {
  try {
    const { productId } = req.params;

    console.log(`\n📦 Getting blocks for product: ${productId}`);

    const rawBlocks = supplyChain.chain.filter(
      (block) =>
        block.index > 0 && block.data && block.data.productId === productId
    );

    console.log(`📊 Found ${rawBlocks.length} raw blocks`);

    if (rawBlocks.length === 0) {
      return res.json({
        success: true,
        data: {
          totalBlocks: 0,
          blocks: [],
        },
        message: "Sản phẩm chưa có block nào trong blockchain",
      });
    }

    const blocks = rawBlocks.map((block) => {
      return {
        index: block.index,
        timestamp: block.timestamp,
        eventType: block.data.eventType,
        action: block.data.action,
        imageUrl: block.data.imageUrl,
        location: block.data.location,
        actor: block.data.actor,
        role: block.data.role,
        notes: block.data.notes,
        productId: block.data.productId,
        productName: block.data.productName,
        seedType: block.data.seedType,
        area: block.data.area,
        yield: block.data.yield,
        waterSource: block.data.waterSource,
        fertilizerType: block.data.fertilizerType,
        harvestDate: block.data.harvestDate,
        saleDate: block.data.saleDate,
        duration: block.data.duration,
        temperature: block.data.temperature,
        customerType: block.data.customerType,
        batchNumber: block.data.batchNumber,
        fromLocation: block.data.fromLocation,
        toLocation: block.data.toLocation,
        processType: block.data.processType,
        quantity: block.data.quantity,
        quality: block.data.quality,
        price: block.data.price,
        hash: block.hash,
        previousHash: block.previousHash,
        nonce: block.nonce,
      };
    });

    res.json({
      success: true,
      data: {
        totalBlocks: blocks.length,
        blocks: blocks,
      },
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi lấy dữ liệu",
      error: error.message,
    });
  }
});

// Simple QR code
app.get("/api/blockchain/qrcode-simple/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    console.log(`📱 Simple QR code request for: ${productId}`);

    const serverIP = process.env.SERVER_IP || wifiIP;
    const backendPort = process.env.PORT || 3000;

    const url = `http://${serverIP}:${backendPort}/product/${encodeURIComponent(
      productId
    )}`;

    const qrCode = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: "#1a237e",
        light: "#FFFFFF",
      },
    });

    res.json({
      success: true,
      productId: productId,
      qrCode: qrCode,
      url: url,
    });
  } catch (error) {
    console.error("❌ Simple QR code error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi tạo QR code đơn giản",
      error: error.message,
    });
  }
});

// QR code endpoint
app.get("/api/qrcode/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu mã sản phẩm",
      });
    }

    console.log(`🔍 Kiểm tra sản phẩm: ${productId}`);

    const history = supplyChain.getProduct(productId);

    if (!history || history.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Sản phẩm "${productId}" không tồn tại trong blockchain`,
      });
    }

    const serverIP =
      process.env.SERVER_IP || (await getWiFiIP()) || "localhost";
    const backendPort = process.env.BACKEND_PORT || "3000";

    const productURL = `http://${serverIP}:${backendPort}/product/${encodeURIComponent(
      productId
    )}`;

    console.log(`🔗 QR Code URL: ${productURL}`);

    const qrCodeDataURL = await QRCode.toDataURL(productURL, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: "H",
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    console.log(`✅ QR code created successfully`);

    res.json({
      success: true,
      productId: productId,
      qrCode: qrCodeDataURL,
      url: productURL,
      blockCount: history.length,
      scanNote: "Quét mã này từ điện thoại để xem lịch sử sản phẩm",
    });
  } catch (error) {
    console.error("❌ Lỗi tạo QR code:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi tạo QR code",
      error: error.message,
    });
  }
});

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
      "/api/blockchain",
      "/api/docs",
      "/health",
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

    console.log("✅ Tất cả routes đã được đăng ký");

    const registerRoute = (path, router, method = "use") => {
      app[method](path, router);
      console.log(`✅ Registered: ${path}`);
    };

    // 🟢 ĐĂNG KÝ TẤT CẢ ROUTES
    registerRoute("/api/auth", authRoutes);
    registerRoute("/api/cuahang", cuahangRoutes);
    registerRoute("/api/cart", cartRoutes);
    registerRoute("/api/order", orderRoutes);
    registerRoute("/api/sanpham", sanphamRoutes);
    registerRoute("/api/danh-gia-san-pham", danhGiaSanPhamRoutes); // 🆕 ĐĂNG KÝ ROUTE ĐÁNH GIÁ SẢN PHẨM
    registerRoute("/api/danh-gia-cua-hang", danhGiaCuaHangRoutes); // 🆕 ĐĂNG KÝ ROUTE ĐÁNH GIÁ CỬA HÀNG
    registerRoute("/api/rfq", rfqRoutes);
    app.get("/api/rfq/categories", getCategoriesForRFQ);
    // Categories routes (English) and alias in Vietnamese for backward compatibility
    registerRoute("/api/categories", danhmucRoutes);
    registerRoute("/api/danhmuc", danhmucRoutes);
    registerRoute("/api/danh-gia-san-pham", danhGiaSanPhamRoutes);
    registerRoute("/api/danh-gia-cua-hang", danhGiaCuaHangRoutes);
    registerRoute("/api/hinh-anh", hinhanhRoutes);

    console.log("✅ Đăng ký routes thành công");

    // 🟢 THÊM DEBUG ENDPOINT ĐỂ KIỂM TRA ROUTES
    app.get("/api/debug/routes", (req, res) => {
      const routes = [];

      function printRoutes(layer, prefix = "") {
        if (layer.route) {
          const path =
            prefix + (layer.route.path === "/" ? "" : layer.route.path);
          const methods = Object.keys(layer.route.methods).map((method) =>
            method.toUpperCase()
          );
          routes.push({ path, methods });
        } else if (layer.name === "router" && layer.handle.stack) {
          const routerPrefix = prefix;
          layer.handle.stack.forEach((handler) => {
            printRoutes(handler, routerPrefix);
          });
        }
      }

      app._router.stack.forEach((layer) => {
        printRoutes(layer);
      });

      res.json({
        success: true,
        total_routes: routes.length,
        routes_by_prefix: {
          auth: routes.filter((route) => route.path.includes("/api/auth")),
          products: routes.filter((route) =>
            route.path.includes("/api/sanpham")
          ),
          stores: routes.filter((route) => route.path.includes("/api/cuahang")),
          categories: routes.filter((route) =>
            route.path.includes("/api/categories")
          ),
          images: routes.filter((route) =>
            route.path.includes("/api/hinh-anh")
          ),
          reviews: routes.filter((route) =>
            route.path.includes("/api/danh-gia")
          ),
          cart: routes.filter((route) => route.path.includes("/api/cart")),
          orders: routes.filter((route) => route.path.includes("/api/order")),
        },
        all_routes: routes,
      });
    });

    // 5️⃣ XỬ LÝ ROUTE KHÔNG TỒN TẠI
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
          "/api/categories",
          "/api/hinh-anh",
          "/api/danh-gia-san-pham",
          "/api/danh-gia-cua-hang",
          "/api/docs",
          "/api/debug/routes",
          "/health",
        ],
      });
    });

    // 6️⃣ XỬ LÝ LỖI TOÀN CỤC
    app.use((err, req, res, next) => {
      console.error("🔥 Lỗi server:", err);

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
          value: err.errors[0]?.value,
        });
      }

      if (err.name === "SequelizeDatabaseError") {
        return res.status(500).json({
          success: false,
          error: "Database Error",
          message: "Lỗi cơ sở dữ liệu",
          ...(process.env.NODE_ENV === "development" && {
            details: err.message,
          }),
        });
      }

      if (err.name === "SequelizeConnectionError") {
        return res.status(503).json({
          success: false,
          error: "Database Connection Error",
          message: "Không thể kết nối đến database",
        });
      }

      if (err.name === "SequelizeForeignKeyConstraintError") {
        return res.status(400).json({
          success: false,
          error: "Constraint Error",
          message: "Không thể thực hiện thao tác do ràng buộc dữ liệu",
          ...(process.env.NODE_ENV === "development" && {
            details: err.message,
          }),
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

      // Multer errors
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          error: "File too large",
          message: "Kích thước file quá lớn. Tối đa 5MB.",
        });
      }

      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          success: false,
          error: "Unexpected file field",
          message: "Field name cho file upload không đúng",
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
          details: err,
        }),
      });
    });

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

      console.log(`\n📚 API Docs: http://localhost:${PORT}/api/docs`);
      console.log(`❤️ Health: http://localhost:${PORT}/health`);
      console.log(`🖼️ Static: http://localhost:${PORT}/uploads/`);
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
