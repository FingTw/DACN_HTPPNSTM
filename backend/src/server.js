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
import employeeRoutes from "./routes/employeeRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";

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

// ==================== CẤU HÌNH ĐƯỜNG DẪN HIỆN TẠI ====================
// GIỮ NGUYÊN cấu trúc hiện tại - KHÔNG THAY ĐỔI
const srcDir = path.dirname(fileURLToPath(import.meta.url)); // backend/src
const backendDir = path.join(srcDir, ".."); // backend

// 🎯 CẤU TRÚC HIỆN TẠI:
// 1. Blockchain: backend/src/public/uploads/others/ (ĐANG DÙNG)
// 2. E-commerce: backend/public/uploads/products/ (ĐANG DÙNG)

const blockchainPublicDir = path.join(srcDir, "public");       // backend/src/public
const ecommercePublicDir = path.join(backendDir, "public");    // backend/public

const blockchainUploadsPath = path.join(blockchainPublicDir, 'uploads'); // backend/src/public/uploads
const ecommerceUploadsPath = path.join(ecommercePublicDir, 'uploads');   // backend/public/uploads

console.log("📂 CẤU TRÚC HIỆN TẠI (GIỮ NGUYÊN):");
console.log("   🟢 BLOCKCHAIN (trong src):");
console.log("     • Path:", blockchainUploadsPath);
console.log("     • Thư mục: others/ (hiện tại)");
console.log("   🛒 E-COMMERCE (ngoài src):");
console.log("     • Path:", ecommerceUploadsPath);
console.log("     • Thư mục: products/ (hiện tại)");

// Kiểm tra thư mục tồn tại
const checkDirectories = () => {
  console.log("\n📁 KIỂM TRA THƯ MỤC HIỆN TẠI:");
  
  // Blockchain directories
  const blockchainOthersPath = path.join(blockchainUploadsPath, 'others');
  if (fs.existsSync(blockchainOthersPath)) {
    const files = fs.readdirSync(blockchainOthersPath);
    console.log(`   🟢 Blockchain/others: ${files.length} files`);
    if (files.length > 0) {
      console.log(`     📄 Ví dụ:`, files.slice(0, 3));
    }
  } else {
    console.log(`   ⚠️  Blockchain/others: Không tồn tại, tạo mới...`);
    fs.mkdirSync(blockchainOthersPath, { recursive: true });
  }
  
  // E-commerce directories
  const ecommerceProductsPath = path.join(ecommerceUploadsPath, 'products');
  if (fs.existsSync(ecommerceProductsPath)) {
    const files = fs.readdirSync(ecommerceProductsPath);
    console.log(`   🛒 E-commerce/products: ${files.length} files`);
    if (files.length > 0) {
      console.log(`     📄 Ví dụ:`, files.slice(0, 3));
    }
  } else {
    console.log(`   ⚠️  E-commerce/products: Không tồn tại, tạo mới...`);
    fs.mkdirSync(ecommerceProductsPath, { recursive: true });
  }
};

checkDirectories();

// ==================== CẤU HÌNH STATIC FILES CHO CẢ HAI ====================
// 🎯 PHỤC VỤ CẢ HAI THƯ MỤC TỪ /uploads/
// Đây là bí quyết: Server sẽ tìm file trong CẢ HAI thư mục

// 1. Tạo middleware thông minh tìm file
const smartStaticMiddleware = (req, res, next) => {
  if (req.originalUrl.startsWith('/uploads/')) {
    const filename = req.originalUrl.split('/uploads/')[1];
    
    // TH 1: Blockchain ảnh (trong others)
    if (filename.startsWith('others/')) {
      const blockchainPath = path.join(blockchainUploadsPath, filename);
      if (fs.existsSync(blockchainPath)) {
        console.log(`🟢 Trả ảnh blockchain: ${filename}`);
        return res.sendFile(blockchainPath);
      }
    }
    
    // TH 2: E-commerce ảnh (trong products)
    if (filename.startsWith('products/')) {
      const ecommercePath = path.join(ecommerceUploadsPath, filename);
      if (fs.existsSync(ecommercePath)) {
        console.log(`🛒 Trả ảnh e-commerce: ${filename}`);
        return res.sendFile(ecommercePath);
      }
    }
    
    // TH 3: Thử tìm trong cả hai (cho tương thích)
    const blockchainPath = path.join(blockchainUploadsPath, filename);
    const ecommercePath = path.join(ecommerceUploadsPath, filename);
    
    if (fs.existsSync(blockchainPath)) {
      console.log(`🟢 Trả file từ blockchain: ${filename}`);
      return res.sendFile(blockchainPath);
    } else if (fs.existsSync(ecommercePath)) {
      console.log(`🛒 Trả file từ e-commerce: ${filename}`);
      return res.sendFile(ecommercePath);
    } else {
      console.log(`❌ File không tồn tại: ${filename}`);
      return res.status(404).send('File not found');
    }
  }
  next();
};

app.use(smartStaticMiddleware);

// 2. Static thông thường cho các thư mục khác
app.use('/public', express.static(ecommercePublicDir));

// ==================== MULTER CONFIGURATION DUY NHẤT NHƯNG THÔNG MINH ====================
// 🎯 MỘT UPLOAD DUY NHẤT, tự động chọn đúng thư mục dựa trên context
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      // Logic xác định thư mục đích
      let uploadPath = ecommerceUploadsPath; // Mặc định: e-commerce
      let folder = "others"; // Mặc định
      
      // PHÂN BIỆT BẰNG URL:
      const url = req.originalUrl.toLowerCase();
      
      // 1. Nếu là blockchain routes
      if (url.includes('/api/blockchain/') || url.includes('/blockchain/')) {
        uploadPath = blockchainUploadsPath;
        folder = "others"; // Blockchain luôn dùng others
        console.log(`🟢 Đích: blockchain/others (URL: ${url})`);
      }
      // 2. Nếu là e-commerce product routes
      else if (url.includes('/sanpham/') || url.includes('/hinh-anh/') || 
               url.includes('/product') && !url.includes('blockchain')) {
        uploadPath = ecommerceUploadsPath;
        folder = "products"; // E-commerce products
        console.log(`🛒 Đích: e-commerce/products (URL: ${url})`);
      }
      // 3. Nếu là avatar
      else if (url.includes('avatar')) {
        uploadPath = ecommerceUploadsPath;
        folder = "avatars";
        console.log(`👤 Đích: e-commerce/avatars (URL: ${url})`);
      }
      
      const fullPath = path.join(uploadPath, folder);
      
      // Đảm bảo thư mục tồn tại
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`📁 Tạo thư mục: ${fullPath}`);
      }
      
      cb(null, fullPath);
    },
    
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname).toLowerCase();
      const filename = `image-${uniqueSuffix}${ext}`;
      console.log(`📄 Tạo filename: ${filename}`);
      cb(null, filename);
    },
  }),
  
  limits: { fileSize: 5 * 1024 * 1024 },
  
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error("❌ Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)!"));
    }
  },
});

// ==================== HELPER FUNCTIONS ====================
// Hàm trả về URL đúng cho frontend - ĐỔI TÊN ĐỂ TRÁNH TRÙNG
const getUploadFileUrl = (filename, type = 'auto') => {
  let url = `/uploads/`;
  
  if (type === 'blockchain' || filename.includes('blockchain')) {
    url += `others/${filename}`;
  } else if (type === 'ecommerce' || filename.includes('product')) {
    url += `products/${filename}`;
  } else if (type === 'avatar') {
    url += `avatars/${filename}`;
  } else {
    // Tự động xác định
    url += `others/${filename}`; // Mặc định cho blockchain
  }
  
  return url;
};

// Middleware log request
app.use((req, res, next) => {
  console.log(
    `📍 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`
  );
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
registerRoute("/api/employee", employeeRoutes);
registerRoute("/api/payment", paymentRoutes);
registerRoute("/api/wallet", walletRoutes);
registerRoute("/api/delivery", deliveryRoutes);

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
    });
  });
}

// ==================== CORE ENDPOINTS ====================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Backend Server is running! (E-commerce + Blockchain)",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    uploadSystem: {
      note: "Hệ thống upload tự động phân biệt blockchain/e-commerce",
      blockchain: {
        path: blockchainUploadsPath,
        urlPattern: "/uploads/others/filename.jpg",
        example: "http://localhost:3000/uploads/others/image-123456789.jpg"
      },
      ecommerce: {
        path: ecommerceUploadsPath,
        urlPattern: "/uploads/products/filename.jpg",
        example: "http://localhost:3000/uploads/products/image-987654321.jpg"
      }
    }
  });
});

// 🟢 HEALTH CHECK ENDPOINT
app.get("/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    
    // Kiểm tra cả hai hệ thống upload
    const blockchainOthers = path.join(blockchainUploadsPath, 'others');
    const ecommerceProducts = path.join(ecommerceUploadsPath, 'products');
    
    const status = {
      database: "Connected",
      blockchainUploads: {
        exists: fs.existsSync(blockchainOthers),
        fileCount: fs.existsSync(blockchainOthers) ? fs.readdirSync(blockchainOthers).length : 0
      },
      ecommerceUploads: {
        exists: fs.existsSync(ecommerceProducts),
        fileCount: fs.existsSync(ecommerceProducts) ? fs.readdirSync(ecommerceProducts).length : 0
      }
    };
    
    res.json({
      success: true,
      status: "OK",
      ...status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: "ERROR",
      database: "Disconnected",
      error: error.message,
    });
  }
});

// 🟢 TEST UPLOAD ENDPOINT - TEST CẢ HAI
app.post("/api/test-upload-blockchain", upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    // Lấy folder từ destination
    const folder = path.basename(path.dirname(req.file.path));
    const filename = req.file.filename;
    const fileUrl = `/uploads/${folder}/${filename}`;
    
    res.json({
      success: true,
      system: 'blockchain',
      message: 'File uploaded to blockchain system',
      file: {
        originalname: req.file.originalname,
        filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      url: fileUrl,
      fullUrl: `http://${req.headers.host}${fileUrl}`,
      note: 'This file should be accessible at the URL above'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/test-upload-ecommerce", upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const folder = path.basename(path.dirname(req.file.path));
    const filename = req.file.filename;
    const fileUrl = `/uploads/${folder}/${filename}`;
    
    res.json({
      success: true,
      system: 'ecommerce',
      message: 'File uploaded to e-commerce system',
      file: {
        originalname: req.file.originalname,
        filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      url: fileUrl,
      fullUrl: `http://${req.headers.host}${fileUrl}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🟢 DEBUG ENDPOINT - Xem tất cả ảnh trong cả hai hệ thống
app.get("/api/debug/uploads", (req, res) => {
  try {
    const result = {
      blockchain: {
        path: blockchainUploadsPath,
        others: { files: [], count: 0 }
      },
      ecommerce: {
        path: ecommerceUploadsPath,
        products: { files: [], count: 0 },
        avatars: { files: [], count: 0 },
        others: { files: [], count: 0 }
      }
    };
    
    // Blockchain files
    const blockchainOthersPath = path.join(blockchainUploadsPath, 'others');
    if (fs.existsSync(blockchainOthersPath)) {
      const files = fs.readdirSync(blockchainOthersPath);
      result.blockchain.others.files = files.slice(0, 20);
      result.blockchain.others.count = files.length;
    }
    
    // E-commerce files
    const ecommerceFolders = ['products', 'avatars', 'others'];
    ecommerceFolders.forEach(folder => {
      const folderPath = path.join(ecommerceUploadsPath, folder);
      if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath);
        result.ecommerce[folder].files = files.slice(0, 20);
        result.ecommerce[folder].count = files.length;
      }
    });
    
    res.json({
      success: true,
      message: "Upload directories status",
      ...result,
      accessUrls: {
        blockchain: "http://localhost:3000/uploads/others/filename.jpg",
        ecommerce: "http://localhost:3000/uploads/products/filename.jpg"
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== BLOCKCHAIN ENDPOINTS (GIỮ NGUYÊN) ====================
app.get("/product/:productId", (req, res) => {
  try {
    const { productId } = req.params;
    
    // Tìm trong blockchain public dir
    const htmlPath = path.join(blockchainPublicDir, "product-blocks.html");
    
    if (!fs.existsSync(htmlPath)) {
      // Fallback: tạo HTML đơn giản
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Product: ${productId}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📦 Product: ${productId}</h1>
            <p>Blockchain product viewer</p>
            <p>API: <code>/api/blockchain/product/${productId}/blocks</code></p>
          </div>
        </body>
        </html>
      `);
    }
    
    let html = fs.readFileSync(htmlPath, "utf8");
    html = html.replace("window.currentProductId = null", `window.currentProductId = "${productId}"`);
    res.send(html);
  } catch (error) {
    res.status(500).send(`<h1>Error loading product</h1><p>${error.message}</p>`);
  }
});

// 🎯 QUAN TRỌNG: Cập nhật endpoint blockchain để trả về URL đúng
app.get("/api/blockchain/product/:productId/blocks", async (req, res) => {
  try {
    const { productId } = req.params;
    const host = req.headers.host;
    
    const rawBlocks = supplyChain.chain.filter(
      (block) => block.index > 0 && block.data && block.data.productId === productId
    );

    const blocks = rawBlocks.map((block) => {
      const blockData = block.data || {};
      let imageUrl = blockData.imageUrl;
      
      // 🎯 FIX: Đảm bảo imageUrl là URL đầy đủ
      if (imageUrl && !imageUrl.startsWith('http')) {
        // Nếu là đường dẫn tương đối, thêm host
        if (imageUrl.startsWith('/uploads/')) {
          imageUrl = `http://${host}${imageUrl}`;
        } else if (imageUrl.includes('others/')) {
          // Blockchain image
          imageUrl = `http://${host}/uploads/${imageUrl}`;
        } else {
          // Mặc định: thêm /uploads/others/
          const filename = path.basename(imageUrl);
          imageUrl = `http://${host}/uploads/others/${filename}`;
        }
      }
      
      return {
        index: block.index,
        timestamp: block.timestamp,
        hash: block.hash,
        previousHash: block.previousHash,
        ...blockData,
        imageUrl: imageUrl // URL đã được fix
      };
    });

    res.json({
      success: true,
      data: {
        totalBlocks: blocks.length,
        blocks: blocks,
      },
      note: "Blockchain images are served from /uploads/others/"
    });
  } catch (error) {
    console.error("❌ Error getting blockchain blocks:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi lấy dữ liệu blockchain",
      error: error.message,
    });
  }
});

// QR Code endpoint
app.get("/api/blockchain/qrcode-simple/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const serverIP = process.env.SERVER_IP || wifiIP;
    const backendPort = process.env.PORT || 3000;
    const url = `http://${serverIP}:${backendPort}/product/${encodeURIComponent(productId)}`;

    const qrCode = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: { dark: "#000000ff", light: "#FFFFFF" },
    });

    res.json({ 
      success: true, 
      productId, 
      qrCode, 
      url,
      message: "Scan QR code to view product blockchain history"
    });
  } catch (error) {
    console.error("❌ Error generating QR code:", error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi tạo QR code", 
      error: error.message 
    });
  }
});

// ==================== ERROR HANDLING ====================
// Handle 404 routes
app.use("*", (req, res, next) => {
  // Cho phép truy cập upload files
  if (req.originalUrl.startsWith('/uploads/')) {
    return next();
  }
  
  console.warn(`❌ Route not found: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: "Route not found",
    message: `Endpoint ${req.method} ${req.originalUrl} không tồn tại`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("🔥 Lỗi server:", err);

  // Multer errors
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: "Lỗi upload file",
      details: err.code === "LIMIT_FILE_SIZE" 
        ? "File quá lớn (tối đa 5MB)" 
        : err.message,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ 
      success: false, 
      error: "Invalid Token", 
      message: "Token không hợp lệ" 
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ 
      success: false, 
      error: "Token Expired", 
      message: "Token đã hết hạn" 
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" 
      ? err.message 
      : "Đã xảy ra lỗi, vui lòng thử lại sau",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ==================== SERVER STARTUP ====================
async function startServer() {
  try {
    console.log("🔄 Đang khởi động server tích hợp...");
    console.log("🌐 Environment:", process.env.NODE_ENV || "development");
    
    // Kết nối database
    console.log("📊 Đang kết nối database...");
    await connectDB();
    console.log("✅ Kết nối database thành công");

    // Đồng bộ database
    console.log("🔄 Đang đồng bộ database...");
    try {
      await syncDB();
      console.log("✅ Đồng bộ database thành công");
    } catch (syncError) {
      console.warn("⚠️ Cảnh báo khi đồng bộ database:", syncError.message);
    }

    // Đăng ký thêm routes
    app.get("/api/rfq/categories", getCategoriesForRFQ);

    const PORT = process.env.PORT || 3000;
    const server = httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`\n🎉 ==========================================`);
      console.log(`✅ Server đang chạy trên port ${PORT}`);
      console.log(`🔗 Base URL: http://localhost:${PORT}`);
      
      console.log(`\n📁 HỆ THỐNG UPLOAD HIỆN TẠI:`);
      console.log(`   🟢 BLOCKCHAIN (không đổi):`);
      console.log(`      • Path: ${blockchainUploadsPath}/others/`);
      console.log(`      • URL: http://localhost:${PORT}/uploads/others/filename.jpg`);
      console.log(`      • Test: POST http://localhost:${PORT}/api/test-upload-blockchain`);
      
      console.log(`\n   🛒 E-COMMERCE (không đổi):`);
      console.log(`      • Path: ${ecommerceUploadsPath}/products/`);
      console.log(`      • URL: http://localhost:${PORT}/uploads/products/filename.jpg`);
      console.log(`      • Test: POST http://localhost:${PORT}/api/test-upload-ecommerce`);
      
      console.log(`\n🎯 TÍNH NĂNG MỚI:`);
      console.log(`   • Một upload middleware duy nhất`);
      console.log(`   • Tự động phân biệt blockchain/e-commerce qua URL`);
      console.log(`   • Hiển thị được cả hai loại ảnh hiện có`);
      
      console.log(`\n🔧 DEBUG:`);
      console.log(`   📊 Xem tất cả ảnh: http://localhost:${PORT}/api/debug/uploads`);
      
      console.log(`\n🎉 ==========================================\n`);
    });

    // Graceful shutdown
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
    process.exit(1);
  }
}

// ▶️ CHẠY SERVER
startServer();

export default app;
// 📦 CHỈ EXPORT MỘT UPLOAD DUY NHẤT - KHÔNG EXPORT HÀM TRÙNG TÊN
export { upload };