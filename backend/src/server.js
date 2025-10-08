// 📦 server.js — File khởi động chính của backend Node.js (REST API)

import express from "express";
import cors from "cors";
import { connectDB, syncDB } from "./config/db.js";
import sequelize from "./config/db.js";

import sanphamroutes from "./routes/sanphamroutes.js"; // 🟢 Import router sản phẩm
import cuahangRoutes from "./routes/cuahangRoutes.js"; // 🟢 Import router cửa hàng
import authRoutes from "./routes/authRoutes.js"; // 🟢 Import router auth
import cartRoutes from "./routes/cartRoutes.js"; // 🟢 Import router giỏ hàng
import orderRoutes from "./routes/orderRoutes.js"; // 🟢 Import router đơn hàng

const app = express();

// 🧩 MIDDLEWARE CẤU HÌNH
app.use(cors()); // Cho phép frontend truy cập API từ domain khác
app.use(express.json()); // Parse JSON data từ client (Postman, frontend,...)

// 🏠 ROUTE CHÍNH - KIỂM TRA SERVER
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Backend Server is running!",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    endpoints: {
      products: "/api/sanpham",
      stores: "/api/cuahang",
      auth: "/api/auth",
      cart: "/api/cart",
      order: "/api/order",
      docs: "Check API documentation for available endpoints",
    },
  });
});

// 🚀 HÀM KHỞI ĐỘNG SERVER
async function startServer() {
  try {
    console.log("🔄 Đang khởi động server...");

    // 1️⃣ KẾT NỐI DATABASE
    console.log("📊 Đang kết nối database...");
    await connectDB();
    console.log("✅ Kết nối database thành công");

    // 2️⃣ KHỞI TẠO MODELS
    console.log("🛠️ Đang khởi tạo models...");
    const initModelsModule = await import("./models/init-models.js");
    const initModels = initModelsModule.default || initModelsModule.initModels;
    const models = initModels(sequelize);
    console.log("✅ Khởi tạo models thành công");

    // 3️⃣ ĐỒNG BỘ DATABASE
    console.log("🔄 Đang đồng bộ database...");
    await syncDB();
    console.log("✅ Đồng bộ database thành công");

    // 4️⃣ ĐĂNG KÝ ROUTES (CHỈ NHỮNG ROUTES ĐÃ TỒN TẠI)
    console.log("🛣️ Đang đăng ký routes...");

    // 🔐 AUTH ROUTES - Xác thực người dùng
    app.use("/api/auth", authRoutes);

    // 🏪 STORE MANAGEMENT ROUTES - Quản lý cửa hàng (ĐÃ BAO GỒM ĐĂNG KÝ GIAN HÀNG)
    app.use("/api/cuahang", cuahangRoutes);
    app.use("/api/auth", authRoutes);
    app.use("/api/cart", cartRoutes);
    app.use("/api/order", orderRoutes);

    // 📦 PRODUCT ROUTES - Quản lý sản phẩm
    app.use("/api/sanpham", sanphamRoutes);

    // ❌ XÓA: app.use("/api/store-registration", storeRegistrationRoutes);

    console.log("✅ Đăng ký routes thành công");

    // 5️⃣ XỬ LÝ ROUTE KHÔNG TỒN TẠI
    app.use("*", (req, res) => {
      res.status(404).json({
        error: "Route not found",
        availableRoutes: ["/api/sanpham", "/api/cuahang", "/api/auth", "/api/cart", "/api/order", "/"],
      });
    });

    // 6️⃣ XỬ LÝ LỖI TOÀN CỤC
    app.use((err, req, res, next) => {
      console.error("🔥 Lỗi server:", err);
      res.status(500).json({
        success: false,
        error: "Lỗi server nội bộ",
        message:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Đã xảy ra lỗi, vui lòng thử lại sau",
      });
    });

    // 7️⃣ KHỞI ĐỘNG SERVER
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 API base URL: http://localhost:${PORT}`);
      console.log(`📦 Products API: http://localhost:${PORT}/api/sanpham`);
      console.log(`🏪 Stores API: http://localhost:${PORT}/api/cuahang`);
      console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
      console.log(`🛒 Cart API: http://localhost:${PORT}/api/cart`);
      console.log(`🧾 Order API: http://localhost:${PORT}/api/order`);
      console.log(`🏠 Test route: http://localhost:${PORT}/`);
    });
  } catch (err) {
    console.error("❌ LỖI KHỞI ĐỘNG SERVER:", err);
    process.exit(1);
  }
}

// ▶️ CHẠY SERVER
startServer();

// 🟢 GHI CHÚ QUAN TRỌNG:
/*
🎯 KIẾN TRÚC HỆ THỐNG ĐƠN GIẢN:

🔐 AUTH LAYER:
   - Xử lý đăng ký, đăng nhập, quên mật khẩu
   - Tạo JWT tokens

🏪 STORE LAYER (TÍCH HỢP ĐĂNG KÝ + QUẢN LÝ):
   - Đăng ký gian hàng & hợp đồng (POST /api/cuahang/dang-ky)
   - Quản lý cửa hàng (CRUD operations)
   - JWT được xử lý TRỰC TIẾP trong controller

📦 PRODUCT LAYER:
   - Quản lý sản phẩm thuộc cửa hàng

🛡️ BẢO MẬT:
   - JWT tokens cho xác thực
   - Xử lý JWT trực tiếp trong controller (không middleware)
   - Transaction cho operations quan trọng

🚀 ƯU ĐIỂM:
   - Code đơn giản, dễ bảo trì
   - Không phụ thuộc vào middleware phức tạp
   - Tích hợp đăng ký gian hàng vào store management
   - Dễ debug và test
*/
