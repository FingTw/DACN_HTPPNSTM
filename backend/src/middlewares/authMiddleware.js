// src/middlewares/authMiddleware.js
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";

const models = initModels(sequelize);
const { taikhoan } = models;

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    console.log("🔐 Auth Header:", authHeader);
    console.log("🔐 Token:", token);

    // 🔥 QUAN TRỌNG: Chấp nhận mọi token hoặc không có token
    if (!token) {
      console.log("⚠️  No token provided - using sample user");
    } else {
      console.log("✅ Token provided (accepting all tokens for testing)");
    }

    // Luôn tìm user thật từ database hoặc dùng user mẫu
    let user = await taikhoan.findOne();
    if (!user) {
      console.log("⚠️  No user in database - using sample user");
      user = {
        MaTK: "TK001",
        TenDangNhap: "testuser",
        Email: "test@example.com",
        LoaiTK: "user",
      };
    }

    // Gán user vào request - LUÔN thành công
    req.user = {
      MaTK: user.MaTK,
      TenDangNhap: user.TenDangNhap,
      Email: user.Email,
      LoaiTK: user.LoaiTK || "user",
    };

    console.log("✅ Authenticated as:", req.user.TenDangNhap);
    next();
  } catch (err) {
    console.error("❌ Auth Middleware Error:", err.message);

    // 🔥 QUAN TRỌNG: Luôn cho phép request tiếp tục
    req.user = {
      MaTK: "TK001",
      TenDangNhap: "testuser",
      Email: "test@example.com",
      LoaiTK: "user",
    };

    console.log("⚠️  Using fallback user due to error");
    next();
  }
};

export const requireAdmin = async (req, res, next) => {
  // Tạm thời cho phép mọi user
  console.log("⚠️  Admin check bypassed for testing");
  next();
};
