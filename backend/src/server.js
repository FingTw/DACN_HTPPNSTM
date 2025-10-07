// 📦 server.js — File khởi động chính của backend Node.js (REST API)

import express from "express";
import cors from "cors";
import { connectDB, syncDB } from "./config/db.js";
import sequelize from "./config/db.js"; // Instance Sequelize (đã cấu hình sẵn)

import sanphamroutes from "./routes/sanphamroutes.js"; // 🟢 Import router sản phẩm
import cuahangRoutes from "./routes/cuahangRoutes.js"; // 🟢 Import router cửa hàng
import authRoutes from "./routes/authRoutes.js"; // 🟢 Import router auth

const app = express(); // Tạo ứng dụng Express

// 🧩 Middleware (các lớp trung gian)
app.use(cors()); // Cho phép frontend truy cập từ domain khác (CORS)
app.use(express.json()); // Cho phép nhận dữ liệu JSON từ client (Postman, frontend,...)

// 🏠 Route chính để test server
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Backend Server is running!",
    timestamp: new Date().toISOString(),
    endpoints: {
      sanpham: "/api/sanpham",
      cuahang: "/api/cuahang",
      auth: "/api/auth",
      docs: "Check API documentation for available endpoints",
    },
  });
});

// 🚀 Hàm khởi động chính
async function startServer() {
  try {
    // 1️⃣ Kết nối cơ sở dữ liệu
    await connectDB();

    // 2️⃣ Import & khởi tạo Models (chuyển định nghĩa bảng trong DB thành đối tượng JS)
    const initModelsModule = await import("./models/init-models.js");
    const initModels = initModelsModule.default || initModelsModule.initModels;
    const models = initModels(sequelize);

    // 3️⃣ Đồng bộ DB (tùy chọn)
    // Nếu bảng chưa tồn tại, Sequelize có thể tự tạo dựa trên model
    await syncDB();

    // 4️⃣ Đăng ký các Router API
    // Mọi request bắt đầu bằng /api/sanpham → sẽ được chuyển tới sanphamRouter
    app.use("/api/sanpham", sanphamroutes);
    app.use("/api/cuahang", cuahangRoutes);
    app.use("/api/auth", authRoutes)

    // 5️⃣ Xử lý route không tồn tại
    app.use("*", (req, res) => {
      res.status(404).json({
        error: "Route not found",
        availableRoutes: ["/api/sanpham", "/api/cuahang", "/api/auth", "/"],
      });
    });

    // 6️⃣ Xử lý lỗi toàn cục
    app.use((err, req, res, next) => {
      console.error("🔥 Error:", err);
      res.status(500).json({
        error: "Internal server error",
        message: err.message,
      });
    });

    // 7️⃣ Khởi động server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 API base URL: http://localhost:${PORT}`);
      console.log(`📦 Products API: http://localhost:${PORT}/api/sanpham`);
      console.log(`🏪 Stores API: http://localhost:${PORT}/api/cuahang`);
      console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
      console.log(`🏠 Test route: http://localhost:${PORT}/`);
    });
  } catch (err) {
    console.error("❌ Lỗi khi khởi động server:", err);
    process.exit(1); // Dừng tiến trình nếu có lỗi nghiêm trọng
  }
}

// ▶️ Chạy server
startServer();
