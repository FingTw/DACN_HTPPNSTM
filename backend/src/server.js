// 📦 server.js — File khởi động chính của backend Node.js (REST API)

import express from "express";
import cors from "cors";
import { connectDB, syncDB } from "./config/db.js";
import sequelize from "./config/db.js";

import cuahangRoutes from "./routes/cuahangRoutes.js"; // 🟢 Import router cửa hàng
import authRoutes from "./routes/authRoutes.js"; // 🟢 Import router auth
import cartRoutes from "./routes/cartRoutes.js"; // 🟢 Import router giỏ hàng
import orderRoutes from "./routes/orderRoutes.js"; // 🟢 Import router đơn hàng
import sanphamRoutes from "./routes/sanphamRoutes.js";
import khuyenmaiRoutes from "./routes/khuyenmaiRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";

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
      discount: "/api/khuyenmai",
      delivery: "/api/delivery",
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

    await syncDB();
    console.log("✅ Đồng bộ database thành công");

    // 4️⃣ ĐĂNG KÝ ROUTES (CHỈ NHỮNG ROUTES ĐÃ TỒN TẠI)
    console.log("🛣️ Đang đăng ký routes...");

    app.use("/api/auth", authRoutes);
    app.use("/api/cuahang", cuahangRoutes);
    app.use("/api/auth", authRoutes);
    app.use("/api/cart", cartRoutes);
    app.use("/api/order", orderRoutes);
    app.use("/api/sanpham", sanphamRoutes);
    app.use("/api/khuyenmai", khuyenmaiRoutes);
    app.use("/api/delivery", deliveryRoutes);
    console.log("✅ Đăng ký routes thành công");

    // 5️⃣ XỬ LÝ ROUTE KHÔNG TỒN TẠI
    app.use("*", (req, res) => {
      res.status(404).json({
        error: "Route not found",
        availableRoutes: [
          "/api/sanpham",
          "/api/cuahang",
          "/api/auth",
          "/api/cart",
          "/api/order",
          "/api/khuyenmai",
          "/api/delivery",
          "/",
        ],
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
      console.log(`🏷️ Discount API: http://localhost:${PORT}/api/khuyenmai`);
      console.log(`🚚 Delivery API: http://localhost:${PORT}/api/delivery`);
      console.log(`🏠 Test route: http://localhost:${PORT}/`);
    });
  } catch (err) {
    console.error("❌ LỖI KHỞI ĐỘNG SERVER:", err);
    process.exit(1);
  }
}

// ▶️ CHẠY SERVER
startServer();
