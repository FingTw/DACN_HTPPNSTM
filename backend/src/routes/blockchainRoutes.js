import express from "express";
import blockchainController from "../controllers/blockchainController.js";
import upload from "../config/upload.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// 🔐 Authentication middleware với database mới
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy token",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is not set");
      return res.status(500).json({
        success: false,
        message: "Lỗi cấu hình server",
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.log("❌ Invalid token:", err.message);
        return res.status(403).json({
          success: false,
          message: "Token không hợp lệ hoặc đã hết hạn",
        });
      }

      console.log("✅ Valid token. User:", {
        MaTK: user.MaTK,
        TenDangNhap: user.TenDangNhap,
        VaiTro: user.VaiTro,
      });
      req.user = user;
      next();
    });
  } catch (error) {
    console.error("❌ Authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi xác thực",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal Server Error",
    });
  }
};

// 🔍 Debug từng route để tìm lỗi
console.log("=== DEBUG CONTROLLER FUNCTIONS ===");
console.log(
  "recordTransaction:",
  typeof blockchainController.recordTransaction
);
console.log(
  "getProductHistory:",
  typeof blockchainController.getProductHistory
);
console.log("getUsersByRole:", typeof blockchainController.getUsersByRole);
console.log("getFullChain:", typeof blockchainController.getFullChain);
console.log(
  "getBlockchainStats:",
  typeof blockchainController.getBlockchainStats
);
console.log("validateChain:", typeof blockchainController.validateChain);
console.log("getBlockByIndex:", typeof blockchainController.getBlockByIndex);
console.log("getUserEvents:", typeof blockchainController.getUserEvents);
console.log("generateQRCode:", typeof blockchainController.generateQRCode);
console.log("================================");

// 📦 Blockchain data routes (cần authentication)
router.post("/record", authenticateToken, (req, res) =>
  blockchainController.recordTransactionHandler(req, res)
);
router.get("/history/:productId", blockchainController.getProductHistory);

// 👥 User management routes (Admin only)
router.get("/users/:role", authenticateToken, (req, res) => {
  if (req.user.VaiTro !== "Admin") {
    return res.status(403).json({
      success: false,
      message: "Chỉ Admin có quyền truy cập",
    });
  }
  blockchainController.getUsersByRole(req, res);
});

// 🔍 Blockchain info routes (public)
router.get("/full-chain", blockchainController.getFullChain);
router.get("/stats", blockchainController.getBlockchainStats);
router.get("/validate", blockchainController.validateChain);
router.get("/block/:index", blockchainController.getBlockByIndex);
router.get("/user-events", blockchainController.getUserEvents);

// 📱 QR Code routes
router.get("/qrcode/:productId", blockchainController.generateQRCode);
router.get("/product/:productId/blocks", blockchainController.getProductBlocks);
router.get(
  "/qrcode/block/:productId/:blockIndex/:blockHash?",
  blockchainController.generateBlockQRCode
);

// 🖼️ Image upload routes
router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Không có file ảnh được upload",
      });
    }

    // Multer storage places files under a subfolder (e.g. `others` or `avatars`).
    // Use the same subfolder when returning the web URL so it matches the on-disk location.
    const imageUrl = `/uploads/others/${req.file.filename}`;

    res.json({
      success: true,
      message: "Upload ảnh thành công!",
      imageUrl: imageUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error("❌ Upload image error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi upload ảnh",
      error: error.message,
    });
  }
});

// 🧪 Test routes
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Blockchain API is running!",
    timestamp: new Date().toISOString(),
  });
});

router.get("/test", (req, res) => {
  res.json({
    status: "success",
    message: "Blockchain test API is working!",
    timestamp: new Date().toISOString(),
  });
});

// Endpoint tạm thời cho user-events
router.get("/user-events", authenticateToken, async (req, res) => {
  try {
    const { username, limit = 10 } = req.query;

    console.log(`📋 Lấy events cho user: ${username}, limit: ${limit}`);

    // Tạm thời trả về mảng rỗng
    // TODO: Thay bằng logic lấy từ database
    res.json({
      success: true,
      data: [],
      message: "Chưa có sự kiện nào",
    });
  } catch (error) {
    console.error("Error getting user events:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy sự kiện",
    });
  }
});

export default router;