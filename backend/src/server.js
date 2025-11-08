// 📦 server.js — File khởi động chính (Merge E-commerce + Blockchain)

import express from "express";
import cors from "cors";
import { connectDB, syncDB } from "./config/db.js";
import sequelize from "./config/db.js";
import dotenv from "dotenv";

// 🟢 BLOCKCHAIN IMPORTS
import http from "http";
import { Server } from "socket.io";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import multer from "multer";
import path from "path";
import fs from "fs";

// 🟢 E-COMMERCE ROUTE IMPORTS
import cuahangRoutes from "./routes/cuahangRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import sanphamRoutes from "./routes/sanphamRoutes.js";
import rfqRoutes from "./routes/RFQ Routes.js";
import danhGiaSanPhamRoutes from "./routes/danhGiaSanPhamRoutes.js";
import danhGiaCuaHangRoutes from "./routes/danhGiaCuaHangRoutes.js";

// 🟢 BLOCKCHAIN ROUTE IMPORTS
import blockchainRoutes from "./routes/blockchainRoutes.js";
import Blockchain from './../blockchain/core/MyBlockchain.js';

// 🟢 LOAD ENVIRONMENT VARIABLES
dotenv.config();

const app = express();
// Khởi tạo blockchain
const supplyChain = new Blockchain();
// 🟢 BLOCKCHAIN HTTP SERVER & SOCKET.IO SETUP
// 🧩 MIDDLEWARE CẤU HÌNH
// backend/src/server.js - SỬA PHẦN CORS
app.use(
  cors({
    origin: function (origin, callback) {
      // CHO PHÉP TẤT CẢ ORIGINS TRONG DEVELOPMENT
      if (!origin || process.env.NODE_ENV === "development") {
        callback(null, true);
      } else {
        // Trong production, chỉ cho phép domains cụ thể
        const allowedOrigins = [
          "http://localhost:5173",
          "http://localhost:5174", // ← THÊM PORT NÀY
          "http://localhost:3000",
          "http://127.0.0.1:5173",
          "http://127.0.0.1:5174", // ← THÊM PORT NÀY
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
      "X-HTTP-Method-Override"
    ],
    exposedHeaders: ["Authorization"]
  })
);
const httpServer = http.createServer(app);
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
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
    }
});

global.io = io;

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('🔌 Client kết nối:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('🔌 Client ngắt kết nối:', socket.id);
    });
    
    socket.on('subscribe:product', (productId) => {
        const room = `product:${productId}`;
        socket.join(room);
        console.log(`📦 Client ${socket.id} đã join room: ${room}`);
    });
    
    socket.on('unsubscribe:product', (productId) => {
        socket.leave(`product:${productId}`);
        console.log(`📦 Client ${socket.id} bỏ theo dõi sản phẩm: ${productId}`);
    });
});



// THÊM MIDDLEWARE ĐỂ XỬ LÝ PREFLIGHT REQUESTS
app.options('*', cors()); // Cho phép tất cả preflight requests

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 🟢 BLOCKCHAIN MULTER UPLOAD CONFIGURATION
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'image-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh!'), false);
        }
    }
});

// Tạo thư mục uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// 🟢 REQUEST LOGGING MIDDLEWARE
app.use((req, res, next) => {
  console.log(
    `📍 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`
  );
  if (Object.keys(req.body).length > 0 && req.method !== "GET") {
    console.log("📦 Request Body:", JSON.stringify(req.body, null, 2));
  }
  next();
});

// 🏠 ROUTE CHÍNH - KIỂM TRA SERVER
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Backend Server is running! (E-commerce + Blockchain)",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      // E-commerce endpoints
      products: "/api/sanpham",
      stores: "/api/cuahang",
      auth: "/api/auth",
      cart: "/api/cart",
      orders: "/api/order",
      product_reviews: "/api/danh-gia-san-pham",
      store_reviews: "/api/danh-gia-cua-hang",
      
      // Blockchain endpoints
      blockchain: {
        auth: "/api/blockchain/register, /api/blockchain/login",
        records: "/api/blockchain/record",
        history: "/api/blockchain/history/:productId",
        qrcode: "/api/blockchain/qrcode/:productId",
        upload: "/api/blockchain/upload-image",
        chain: "/api/blockchain/full-chain",
        stats: "/api/blockchain/stats"
      }
    },
    documentation: "Check /api/docs for detailed API documentation",
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
      services: {
        ecommerce: "Running",
        blockchain: "Running",
        database: "Connected",
        websocket: "Active"
      }
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
    message: "API Documentation - Integrated System",
    endpoints: {
      ecommerce: {
        "GET /api/sanpham": "Lấy danh sách sản phẩm",
        "GET /api/cuahang": "Lấy danh sách cửa hàng",
        "POST /api/auth/login": "Đăng nhập e-commerce",
        // ... your existing e-commerce endpoints
      },
      blockchain: {
        "POST /api/blockchain/register": "Đăng ký tài khoản blockchain",
        "POST /api/blockchain/login": "Đăng nhập blockchain", 
        "POST /api/blockchain/record": "Ghi dữ liệu lên blockchain (cần auth)",
        "GET /api/blockchain/history/:productId": "Lấy lịch sử sản phẩm",
        "GET /api/blockchain/qrcode/:productId": "Tạo QR code truy xuất nguồn gốc",
        "POST /api/blockchain/upload-image": "Upload ảnh cho sản phẩm",
        "GET /api/blockchain/full-chain": "Xem toàn bộ blockchain",
        "GET /product/:productId": "Giao diện xem lịch sử sản phẩm"
      }
    }
  });
});

// 🚀 HÀM KHỞI ĐỘNG SERVER
async function startServer() {
  try {
    console.log("🔄 Đang khởi động server tích hợp...");
    console.log("🌐 Environment:", process.env.NODE_ENV || "development");

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

    // 3️⃣ ĐỒNG BỘ DATABASE
    console.log("🔄 Đang đồng bộ database...");
    await syncDB();
    console.log("✅ Đồng bộ database thành công");

    // 4️⃣ ĐĂNG KÝ ROUTES
    console.log("🛣️ Đang đăng ký routes...");

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

    // 🟢 BLOCKCHAIN ROUTES
    if (blockchainRoutes) {
      registerRoute("/api/blockchain", blockchainRoutes);
      console.log('🎯 Blockchain routes đã được đăng ký');
    } else {
      console.log('⚠️ Blockchain routes không khả dụng, chỉ e-commerce hoạt động');
      
      // Tạo fallback route cho blockchain
      app.use('/api/blockchain', (req, res) => {
        res.status(503).json({
          success: false,
          message: 'Blockchain service đang bảo trì',
          endpoints: ['/health', '/stats', '/record', '/history/:productId']
        });
      });
    }

    console.log("✅ Đăng ký routes thành công");

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
          "/api/danh-gia-san-pham", 
          "/api/danh-gia-cua-hang",
          "/api/blockchain",
          "/api/docs",
          "/health",
        ],
      });
    });

    // 6️⃣ XỬ LÝ LỖI TOÀN CỤC
    app.use((err, req, res, next) => {
      console.error("🔥 Lỗi server:", err);

      // Multer errors
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File quá lớn',
            details: 'Kích thước file tối đa là 5MB'
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

    // 7️⃣ KHỞI ĐỘNG SERVER
    const PORT = process.env.PORT || 3000;
    const server = httpServer.listen(PORT, () => {
      console.log(`\n🎉 ==========================================`);
      console.log(`✅ SERVER TÍCH HỢP CHẠY THÀNH CÔNG`);
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 API Base: http://localhost:${PORT}`);
      console.log(`🔌 WebSocket: http://localhost:${PORT}`);
      console.log(`\n🛒 E-COMMERCE ENDPOINTS:`);
      console.log(`   📦 Products: http://localhost:${PORT}/api/sanpham`);
      console.log(`   🏪 Stores: http://localhost:${PORT}/api/cuahang`);
      console.log(`   🔐 Auth: http://localhost:${PORT}/api/auth`);
      console.log(`   🛒 Cart: http://localhost:${PORT}/api/cart`);
      console.log(`\n⛓️ BLOCKCHAIN ENDPOINTS:`);
      console.log(`   🔐 Auth: http://localhost:${PORT}/api/blockchain/login`);
      console.log(`   📝 Records: http://localhost:${PORT}/api/blockchain/record`);
      console.log(`   📊 Chain: http://localhost:${PORT}/api/blockchain/full-chain`);
      console.log(`   📱 QR Code: http://localhost:${PORT}/api/blockchain/qrcode/PRODUCT_ID`);
      console.log(`\n📚 Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`❤️ Health: http://localhost:${PORT}/health`);
      console.log(`🎉 ==========================================\n`);
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
        console.error("❌ Could not close connections in time, forcefully shutting down");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("unhandledRejection", (reason, promise) => {
      console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
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