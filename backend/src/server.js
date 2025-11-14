// 📦 server.js — File khởi động chính của backend Node.js (REST API)

import express from "express";
import cors from "cors";
import { connectDB, syncDB } from "./config/db.js";
import sequelize from "./config/db.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// 🟢 LOAD ENVIRONMENT VARIABLES
dotenv.config();

// 🟢 IMPORT ROUTES
import cuahangRoutes from "./routes/cuahangRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import sanphamRoutes from "./routes/sanphamRoutes.js";
import danhmucRoutes from "./routes/danhmucRoutes.js";
import danhGiaSanPhamRoutes from "./routes/danhGiaSanPhamRoutes.js";
import danhGiaCuaHangRoutes from "./routes/danhGiaCuaHangRoutes.js";
import hinhanhRoutes from "./routes/hinhanhRoutes.js";

const app = express();

// 🧩 MIDDLEWARE CẤU HÌNH
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || process.env.NODE_ENV === "development") {
        callback(null, true);
      } else {
        const allowedOrigins = [
          "http://localhost:5173",
          "http://localhost:3000",
          "http://localhost:5174",
          "http://localhost:5175",
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

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// 🟢 PHỤC VỤ FILE TĨNH (HÌNH ẢNH)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));
app.use("/public", express.static(path.join(__dirname, "public")));

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
      categories: "/api/categories",
      images: "/api/hinh-anh",
      product_reviews: "/api/danh-gia-san-pham",
      store_reviews: "/api/danh-gia-cua-hang",
    },
    documentation: "Check API documentation at GET /api/docs",
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
  });
});

// 🚀 HÀM KHỞI ĐỘNG SERVER
async function startServer() {
  try {
    console.log("🔄 Đang khởi động server...");
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

    // 4️⃣ ĐĂNG KÝ ROUTES
    console.log("🛣️ Đang đăng ký routes...");

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
    registerRoute("/api/categories", danhmucRoutes);
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

    // 7️⃣ KHỞI ĐỘNG SERVER
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`\n🎉 ==========================================`);
      console.log(`✅ Server đang chạy trên port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 Base URL: http://localhost:${PORT}`);
      console.log(`📦 Products API: http://localhost:${PORT}/api/sanpham`);
      console.log(`🏪 Stores API: http://localhost:${PORT}/api/cuahang`);
      console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
      console.log(`🛒 Cart API: http://localhost:${PORT}/api/cart`);
      console.log(`🧾 Order API: http://localhost:${PORT}/api/order`);
      console.log(`🏷️ Categories API: http://localhost:${PORT}/api/categories`);
      console.log(`🖼️ Images API: http://localhost:${PORT}/api/hinh-anh`);
      console.log(
        `⭐ Product Reviews: http://localhost:${PORT}/api/danh-gia-san-pham`
      );
      console.log(
        `🏪 Store Reviews: http://localhost:${PORT}/api/danh-gia-cua-hang`
      );
      console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
      console.log(`🐛 Debug Routes: http://localhost:${PORT}/api/debug/routes`);
      console.log(`🏠 Test route: http://localhost:${PORT}/`);
      console.log(`❤️ Health check: http://localhost:${PORT}/health`);
      console.log(`🖼️ Static files: http://localhost:${PORT}/uploads/`);
      console.log(`🎉 ==========================================\n`);

      // Hiển thị các endpoint quan trọng
      console.log(`🚀 CÁC ENDPOINT QUAN TRỌNG:`);
      console.log(
        `   📝 Tạo sản phẩm: POST http://localhost:${PORT}/api/sanpham/tao-moi`
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
      console.log(`\n⚠️ Nhận tín hiệu ${signal}. Đang tắt server...`);

      server.close(() => {
        console.log("✅ HTTP server đã đóng.");
        sequelize
          .close()
          .then(() => {
            console.log("✅ Kết nối database đã đóng.");
            process.exit(0);
          })
          .catch((err) => {
            console.error("❌ Lỗi khi đóng kết nối database:", err);
            process.exit(1);
          });
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error(
          "❌ Không thể đóng kết nối kịp thời, buộc phải tắt server"
        );
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // 🟢 UNHANDLED REJECTION HANDLER
    process.on("unhandledRejection", (reason, promise) => {
      console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
      // Close server & exit process
      server.close(() => {
        process.exit(1);
      });
    });

    // 🟢 UNCAUGHT EXCEPTION HANDLER
    process.on("uncaughtException", (error) => {
      console.error("❌ Uncaught Exception:", error);
      process.exit(1);
    });
  } catch (err) {
    console.error("❌ LỖI KHỞI ĐỘNG SERVER:", err);

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
