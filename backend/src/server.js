// 📦 server.js — File khởi động chính của backend Node.js (REST API)

import express from "express";
import cors from "cors";
import { connectDB, syncDB } from "./config/db.js";
import sequelize from "./config/db.js";
import dotenv from "dotenv";

// 🟢 LOAD ENVIRONMENT VARIABLES
dotenv.config();

// 🟢 IMPORT ROUTES
import cuahangRoutes from "./routes/cuahangRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import sanphamRoutes from "./routes/sanphamRoutes.js";
<<<<<<< HEAD
//import rfqRoutes from "./routes/rfqRoutes.js";
=======
import rfqRoutes from "./routes/RFQ Routes.js";
>>>>>>> 5eed40f559ab990db032bc34a68d039fb95b4ce6

import danhGiaSanPhamRoutes from "./routes/danhGiaSanPhamRoutes.js";
import danhGiaCuaHangRoutes from "./routes/danhGiaCuaHangRoutes.js"; // 🆕 THÊM ROUTE ĐÁNH GIÁ CỬA HÀNG

const app = express();

// 🧩 MIDDLEWARE CẤU HÌNH
// server.js - CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Cho phép tất cả origins trong development
      if (!origin || process.env.NODE_ENV === "development") {
        callback(null, true);
      } else {
        // Trong production, chỉ cho phép domains cụ thể
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
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  })
);

app.use(express.json({ limit: "10mb" })); // Tăng limit cho JSON
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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
    message: "🚀 Backend Server is running!",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      products: "/api/sanpham",
      stores: "/api/cuahang",
      auth: "/api/auth",
      cart: "/api/cart",
      orders: "/api/order",
      product_reviews: "/api/danh-gia-san-pham", // 🆕 THÊM ENDPOINT MỚI
      store_reviews: "/api/danh-gia-cua-hang", // 🆕 THÊM ENDPOINT MỚI
    },
    documentation: "Check API documentation for available endpoints",
  });
});

// 🟢 HEALTH CHECK ENDPOINT
app.get("/health", async (req, res) => {
  try {
    // Kiểm tra kết nối database
    await sequelize.authenticate();

    res.json({
      success: true,
      status: "OK",
      database: "Connected",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
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
    message: "API Documentation",
    endpoints: {
      // SẢN PHẨM
      products: {
        "GET /api/sanpham": "Lấy danh sách sản phẩm (có phân trang, tìm kiếm)",
        "GET /api/sanpham/tim-kiem": "Tìm kiếm sản phẩm nâng cao",
        "GET /api/sanpham/:MaSP": "Lấy chi tiết sản phẩm",
        "GET /api/sanpham/cua-hang/:MaCH": "Sản phẩm theo cửa hàng",
        "POST /api/sanpham/tao-moi": "Thêm sản phẩm mới (cần auth)",
        "PUT /api/sanpham/cap-nhat/:MaSP": "Cập nhật sản phẩm (cần auth)",
        "DELETE /api/sanpham/xoa/:MaSP": "Xóa sản phẩm (cần auth)",
        "GET /api/sanpham/cua-hang-cua-toi/danh-sach":
          "Sản phẩm của tôi (cần auth)",
      },

      // CỬA HÀNG
      stores: {
        "GET /api/cuahang": "Lấy danh sách cửa hàng",
        "GET /api/cuahang/:MaCH": "Lấy chi tiết cửa hàng",
        "POST /api/cuahang/dang-ky": "Đăng ký cửa hàng (cần auth)",
        "GET /api/cuahang/cua-toi": "Cửa hàng của tôi (cần auth)",
        "PUT /api/cuahang/chinh-sua/:MaCH": "Cập nhật cửa hàng (cần auth)",
        "DELETE /api/cuahang/xoa/:MaCH": "Xóa cửa hàng (cần auth)",
      },

      // ĐÁNH GIÁ SẢN PHẨM
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

      // ĐÁNH GIÁ CỬA HÀNG
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

      // AUTH
      auth: {
        "POST /api/auth/register": "Đăng ký tài khoản",
        "POST /api/auth/login": "Đăng nhập",
        "GET /api/auth/update-personal-info": "Thông tin tôi",
        "POST /api/auth/logout": "Đăng xuất",
        "POST /api/auth/forgot-password": "Quên mật khẩu",
        "POST /api/auth/reset-password": "Đặt lại mật khẩu",
      },

      cart: "/api/cart",
      orders: "/api/order",
    },
  });
});

// 🚀 HÀM KHỞI ĐỘNG SERVER
async function startServer() {
  try {
    console.log("🔄 Đang khởi động server...");
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

    // 🟢 ĐĂNG KÝ ROUTES VỚI LOGGING MIDDLEWARE
    const registerRoute = (path, router, method = "use") => {
      app[method](path, router);
      console.log(`✅ Registered: ${path}`);
    };

    registerRoute("/api/auth", authRoutes);
    registerRoute("/api/cuahang", cuahangRoutes);
    registerRoute("/api/cart", cartRoutes);
    registerRoute("/api/order", orderRoutes);
    registerRoute("/api/sanpham", sanphamRoutes);
    registerRoute("/api/danh-gia-san-pham", danhGiaSanPhamRoutes); // 🆕 ĐĂNG KÝ ROUTE ĐÁNH GIÁ SẢN PHẨM
    registerRoute("/api/danh-gia-cua-hang", danhGiaCuaHangRoutes); // 🆕 ĐĂNG KÝ ROUTE ĐÁNH GIÁ CỬA HÀNG
    //registerRoute("/api/rfq", rfqRoutes);

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
          "/api/docs",
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
          details: err,
        }),
      });
    });

    // 7️⃣ KHỞI ĐỘNG SERVER
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      console.log(`\n🎉 ==========================================`);
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 API base URL: http://localhost:${PORT}`);
      console.log(`📦 Products API: http://localhost:${PORT}/api/sanpham`);
      console.log(`🏪 Stores API: http://localhost:${PORT}/api/cuahang`);
      console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
      console.log(`🛒 Cart API: http://localhost:${PORT}/api/cart`);
      console.log(`🧾 Order API: http://localhost:${PORT}/api/order`);

      console.log(
        `⭐ Product Reviews: http://localhost:${PORT}/api/danh-gia-san-pham`
      ); // 🆕
      console.log(
        `🏪 Store Reviews: http://localhost:${PORT}/api/danh-gia-cua-hang`
      ); // 🆕
      console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`); // 🆕
      console.log(`🏠 Test route: http://localhost:${PORT}/`);
      console.log(`❤️ Health check: http://localhost:${PORT}/health`);
      console.log(`🎉 ==========================================\n`);
    });

    // 🟢 GRACEFUL SHUTDOWN
    const gracefulShutdown = (signal) => {
      console.log(`\n⚠️ Received ${signal}. Shutting down gracefully...`);

      server.close(() => {
        console.log("✅ HTTP server closed.");
        sequelize
          .close()
          .then(() => {
            console.log("✅ Database connection closed.");
            process.exit(0);
          })
          .catch((err) => {
            console.error("❌ Error closing database connection:", err);
            process.exit(1);
          });
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error(
          "❌ Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // 🟢 UNHANDLED REJECTION HANDLER
    process.on("unhandledRejection", (reason, promise) => {
      console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
    });

    // 🟢 UNCAUGHT EXCEPTION HANDLER
    process.on("uncaughtException", (error) => {
      console.error("❌ Uncaught Exception:", error);
      process.exit(1);
    });
  } catch (err) {
    console.error("❌ LỖI KHỞI ĐỘNG SERVER:", err);

    // Log detailed error information
    if (err.original) {
      console.error("📌 Original Error:", err.original);
    }
    if (err.sql) {
      console.error("📌 SQL Query:", err.sql);
    }
    if (err.stack) {
      console.error("📌 Stack Trace:", err.stack);
    }

    process.exit(1);
  }
}

// ▶️ CHẠY SERVER
startServer();

export default app;
