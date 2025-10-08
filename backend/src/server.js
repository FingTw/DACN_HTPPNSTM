// 📦 server.js — File khởi động chính của backend Node.js (REST API)

import express from "express";
import cors from "cors";
import { connectDB, syncDB } from "./config/db.js";
import sequelize from "./config/db.js";

// 🟢 IMPORT ROUTES (CHỈ NHỮNG ROUTES ĐÃ TỒN TẠI)
import sanphamRoutes from "./routes/sanphamRoutes.js";
import cuahangRoutes from "./routes/cuahangRoutes.js";
import authRoutes from "./routes/authRoutes.js";
// ❌ XÓA: import storeRegistrationRoutes from "./routes/storeRegistrationRoutes.js";

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
      // ❌ XÓA: store_registration: "/api/store-registration",
      documentation: "Xem file server.js để biết chi tiết endpoints",
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

    // 📦 PRODUCT ROUTES - Quản lý sản phẩm
    app.use("/api/sanpham", sanphamRoutes);

    // ❌ XÓA: app.use("/api/store-registration", storeRegistrationRoutes);

    console.log("✅ Đăng ký routes thành công");

    // 5️⃣ XỬ LÝ ROUTE KHÔNG TỒN TẠI
    app.use("*", (req, res) => {
      res.status(404).json({
        success: false,
        error: "Route không tồn tại",
        available_routes: {
          auth: [
            "POST /api/auth/register - Đăng ký tài khoản",
            "POST /api/auth/login - Đăng nhập (lấy JWT token)",
            "POST /api/auth/forgot-password - Quên mật khẩu",
            "POST /api/auth/reset-password - Đặt lại mật khẩu",
            "POST /api/auth/change-password - Đổi mật khẩu (cần JWT)",
          ],
          stores: [
            "GET    /api/cuahang - Danh sách cửa hàng (public)",
            "GET    /api/cuahang/search?keyword=... - Tìm kiếm cửa hàng (public)",
            "GET    /api/cuahang/:MaCH - Chi tiết cửa hàng (public)",
            "PATCH  /api/cuahang/:MaCH/theo-doi - Theo dõi cửa hàng (public)",
            "GET    /api/cuahang/:MaCH/thong-ke-ton-kho - Thống kê tồn kho (public)",
            "POST   /api/cuahang/dang-ky - Đăng ký cửa hàng (cần JWT)",
            "GET    /api/cuahang/tao/cua-hang-cua-toi - Cửa hàng của tôi (cần JWT)",
            "PUT    /api/cuahang/chinh-sua/:MaCH - Chỉnh sửa cửa hàng (cần JWT + chủ cửa hàng)",
            "DELETE /api/cuahang/xoa/:MaCH - Xóa cửa hàng (cần JWT + chủ cửa hàng)",
            "GET    /api/cuahang/tao/thong-ke-ton-kho - Thống kê tồn kho của tôi (cần JWT + chủ cửa hàng)",
            "GET    /api/cuahang/tao/thong-ke-ton-kho/loc - Thống kê có lọc (cần JWT + chủ cửa hàng)",
          ],
          products: [
            "GET    /api/sanpham - Danh sách sản phẩm",
            "POST   /api/sanpham - Tạo sản phẩm mới",
            "GET    /api/sanpham/:MaSP - Chi tiết sản phẩm",
            "PUT    /api/sanpham/:MaSP - Cập nhật sản phẩm",
            "DELETE /api/sanpham/:MaSP - Xóa sản phẩm",
          ],
        },
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
      console.log(`\n🎉 SERVER ĐÃ KHỞI ĐỘNG THÀNH CÔNG!`);
      console.log(`═`.repeat(50));
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`🕐 Time: ${new Date().toLocaleString("vi-VN")}`);
      console.log(`═`.repeat(50));

      console.log(`\n📚 DANH SÁCH API ENDPOINTS:`);
      console.log(`🔐 AUTHENTICATION:`);
      console.log(
        `   POST http://localhost:${PORT}/api/auth/register - Đăng ký tài khoản`
      );
      console.log(
        `   POST http://localhost:${PORT}/api/auth/login - Đăng nhập (lấy JWT token)`
      );

      console.log(`\n🏪 STORE REGISTRATION & MANAGEMENT (BẮT BUỘC JWT):`);
      console.log(
        `   POST http://localhost:${PORT}/api/cuahang/dang-ky - Đăng ký gian hàng & hợp đồng`
      );
      console.log(
        `   GET  http://localhost:${PORT}/api/cuahang/tao/cua-hang-cua-toi - Xem gian hàng của tôi`
      );
      console.log(
        `   GET  http://localhost:${PORT}/api/cuahang - Danh sách cửa hàng (PUBLIC)`
      );
      console.log(
        `   PUT  http://localhost:${PORT}/api/cuahang/chinh-sua/:MaCH - Chỉnh sửa cửa hàng`
      );

      console.log(`\n📦 PRODUCT MANAGEMENT:`);
      console.log(
        `   GET  http://localhost:${PORT}/api/sanpham - Danh sách sản phẩm`
      );

      console.log(`\n🛠️ TESTING INSTRUCTIONS:`);
      console.log(`   1. Đăng ký tài khoản: POST /api/auth/register`);
      console.log(`   2. Đăng nhập lấy token: POST /api/auth/login`);
      console.log(`   3. Dán token vào Postman Authorization → Bearer Token`);
      console.log(`   4. Đăng ký gian hàng: POST /api/cuahang/dang-ky`);
      console.log(
        `   5. Kiểm tra gian hàng: GET /api/cuahang/tao/cua-hang-cua-toi`
      );

      console.log(`\n⚠️  LƯU Ý QUAN TRỌNG:`);
      console.log(`   - Đăng ký gian hàng CẦN JWT token từ bước đăng nhập`);
      console.log(`   - Mỗi user chỉ được đăng ký 1 gian hàng duy nhất`);
      console.log(
        `   - Token có thời hạn 1 giờ (có thể renew bằng cách đăng nhập lại)`
      );
      console.log(`   - Sử dụng Postman để test API endpoints`);
      console.log(
        `   - JWT được xử lý trực tiếp trong controller (không cần middleware)`
      );
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
