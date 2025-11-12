// 📦 server.js — File khởi động chính (Merge E-commerce + Blockchain)
import express from "express";
import cors from "cors";
import { connectDB, syncDB } from "./config/db.js";
import sequelize from "./config/db.js";

// 🟢 BLOCKCHAIN IMPORTS
import http from "http";
import { Server } from "socket.io";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

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
import os from 'os';
import blockchainRoutes from "./routes/blockchainRoutes.js";
import dotenv from "dotenv";

// 🟢 LOAD ENVIRONMENT VARIABLES
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hàm lấy tất cả IP
function getAllIPs() {
    const interfaces = os.networkInterfaces();
    const ips = [];
    
    console.log('🌐 Tất cả IP addresses trên máy:');
    for (const [name, nets] of Object.entries(interfaces)) {
        for (const net of nets) {
            if (net.family === 'IPv4' && !net.internal) {
                console.log(`   ${name}: ${net.address}`);
                ips.push(net.address);
            }
        }
    }
    return ips;
}
// Function này phải được định nghĩa TRƯỚC các route sử dụng nó
function getWiFiIP() {
    const interfaces = os.networkInterfaces();
    
    for (const [name, addresses] of Object.entries(interfaces)) {
        for (const address of addresses) {
            if (address.family === 'IPv4' && !address.internal) {
                if (name.toLowerCase().includes('wi-fi') || 
                    name.toLowerCase().includes('wireless') ||
                    name.toLowerCase().includes('wlan')) {
                    return address.address;
                }
            }
        }
    }
    return 'localhost'; // Fallback
}
const wifiIP = getWiFiIP();

console.log(`🌐 Phát hiện IP WiFi: ${wifiIP}`);

const app = express();
// Khởi tạo blockchain
import Blockchain from './../blockchain/core/MyBlockchain.js';
const supplyChain = new Blockchain();
getAllIPs();
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
          "http://localhost:5174", 
          "http://localhost:3000",
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

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
// 🟢 Multer cấu hình thông minh — tự động chọn thư mục
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = "others";

    // Nếu route chứa từ khóa "avatar" => thư mục avatars
    if (req.originalUrl.includes("avatar")) {
      folder = "avatars";
    } 
    // Nếu route chứa từ khóa "product" => thư mục products
    else if (req.originalUrl.includes("product")) {
      folder = "products";
    }

    const uploadDir = path.join(process.cwd(), "uploads", folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("❌ Chỉ chấp nhận file ảnh!"), false);
    }
  },
});

const uploadsRoot = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}
app.use('/uploads', express.static(uploadsRoot));

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

// Route hiển thị giao diện mobile từ file HTML trong public
// THÊM DEBUG VÀO ROUTE /product/:productId
app.get('/product/:productId', (req, res) => {
    try {
        const { productId } = req.params;
        
        console.log(`📱 Mobile access - Loading HTML for: ${productId}`);
        console.log(`🌐 Client: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);
        
        const htmlPath = path.join(__dirname, 'public', 'product-blocks.html');
        console.log(`📁 HTML path: ${htmlPath}`);
        console.log(`📂 File exists: ${fs.existsSync(htmlPath)}`);
        
        if (!fs.existsSync(htmlPath)) {
            console.log('❌ HTML file not found! Creating simple fallback...');
            // Trả về HTML đơn giản thay vì lỗi
            return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Product: ${productId}</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: Arial; padding: 20px; background: #f0f0f0; }
                        .container { background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 50px auto; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>📦 Product: ${productId}</h1>
                        <p>✅ Server is working!</p>
                        <p>🔗 QR code system is active</p>
                        <p>⏰ ${new Date().toLocaleString()}</p>
                    </div>
                </body>
                </html>
            `);
        }
        
        let html = fs.readFileSync(htmlPath, 'utf8');
        console.log(`✅ HTML file loaded, size: ${html.length} chars`);
        
        // Inject productId
        html = html.replace('<!-- PRODUCT_ID_PLACEHOLDER -->', productId);
        html = html.replace('window.currentProductId = null', `window.currentProductId = "${productId}"`);
        
        res.send(html);
        console.log(`✅ Sent HTML response for product: ${productId}`);
        
    } catch (error) {
        console.error('❌ Lỗi hiển thị giao diện mobile:', error);
        // Fallback response
        res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>Error</title><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body>
                <h1>❌ Lỗi tải sản phẩm</h1>
                <p>Product: ${req.params.productId}</p>
                <p>Error: ${error.message}</p>
                <p>Hãy thử lại sau!</p>
            </body>
            </html>
        `);
    }
});
// 🔥 THÊM ENDPOINT BỊ THIẾU - Đặt trước phần khởi động server
// SỬA ENDPOINT TRONG server.js - ĐẢM BẢO TRẢ VỀ ĐỦ CÁC TRƯỜNG
app.get('/api/blockchain/product/:productId/blocks', async (req, res) => {
    try {
        const { productId } = req.params;
        
        console.log(`\n📦 Getting blocks for product: ${productId}`);
        
        // Lấy từ blockchain trực tiếp để có đủ data
        const rawBlocks = supplyChain.chain.filter(block => 
            block.index > 0 && block.data && block.data.productId === productId
        );

        console.log(`📊 Found ${rawBlocks.length} raw blocks`);

        if (rawBlocks.length === 0) {
            return res.json({
                success: true,
                data: {
                    totalBlocks: 0,
                    blocks: []
                },
                message: 'Sản phẩm chưa có block nào trong blockchain'
            });
        }

        // Format data với ĐẦY ĐỦ các trường từ block.data
        const blocks = rawBlocks.map(block => {
            console.log('🔍 Raw block data:', block.data);
            
            return {
                index: block.index,
                timestamp: block.timestamp,
                
                // 🔥 QUAN TRỌNG: Lấy TẤT CẢ các trường từ block.data
                eventType: block.data.eventType,
                action: block.data.action,
                imageUrl: block.data.imageUrl,
                
                // Thông tin cơ bản
                location: block.data.location,
                actor: block.data.actor,
                role: block.data.role,
                notes: block.data.notes,
                
                // Product info
                productId: block.data.productId,
                productName: block.data.productName,
                
                // 🔥 THÊM TẤT CẢ CÁC TRƯỜNG SỰ KIỆN
                seedType: block.data.seedType,
                area: block.data.area,
                yield: block.data.yield,
                waterSource: block.data.waterSource,
                fertilizerType: block.data.fertilizerType,
                harvestDate: block.data.harvestDate,
                saleDate: block.data.saleDate,
                duration: block.data.duration,
                temperature: block.data.temperature,
                customerType: block.data.customerType,
                batchNumber: block.data.batchNumber,
                fromLocation: block.data.fromLocation,
                toLocation: block.data.toLocation,
                processType: block.data.processType,
                quantity: block.data.quantity,
                quality: block.data.quality,
                price: block.data.price,
                
                // Blockchain metadata
                hash: block.hash,
                previousHash: block.previousHash,
                nonce: block.nonce
            };
        });

        // Debug: kiểm tra xem có trả về seedType và area không
        console.log(`✅ First block fields:`, {
            eventType: blocks[0]?.eventType,
            seedType: blocks[0]?.seedType,
            area: blocks[0]?.area,
            allKeys: Object.keys(blocks[0] || {})
        });

        res.json({
            success: true,
            data: {
                totalBlocks: blocks.length,
                blocks: blocks
            }
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy dữ liệu',
            error: error.message
        });
    }
});

// Thêm route này vào server.js (sau các route khác)
// app.get('/api/blockchain/qrcode-simple/:productId', async (req, res) => {
//     try {
//         const { productId } = req.params;
        
//         console.log(`📱 Simple QR code request for: ${productId}`);
        
//         const serverIP = process.env.SERVER_IP || wifiIP;
//         const backendPort = process.env.PORT || 3000;
        
//         const url = `http://${serverIP}:${backendPort}/product/${encodeURIComponent(productId)}`;
        
//         const qrCode = await QRCode.toDataURL(url, {
//             width: 300,
//             margin: 2,
//             color: {
//                 dark: '#1a237e',
//                 light: '#FFFFFF'
//             }
//         });
        
//         res.json({
//             success: true,
//             productId: productId,
//             qrCode: qrCode,
//             url: url
//         });
        
//     } catch (error) {
//         console.error('❌ Simple QR code error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Lỗi tạo QR code đơn giản',
//             error: error.message
//         });
//     }
// });


// Route này đã có sẵn trong server.js bạn gửi
app.get('/api/qrcode/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        
        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu mã sản phẩm'
            });
        }

        console.log(`🔍 Kiểm tra sản phẩm: ${productId}`);
        
        const history = supplyChain.getProduct(productId);
        
        if (!history || history.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Sản phẩm "${productId}" không tồn tại trong blockchain`
            });
        }

        // SỬA: Gọi async function với await
        const serverIP = process.env.SERVER_IP || (await getWiFiIP()) || 'localhost';
        const backendPort = process.env.BACKEND_PORT || '3000';
        
        const productURL = `http://${serverIP}:${backendPort}/product/${encodeURIComponent(productId)}`;
        
        console.log(`🔗 QR Code URL: ${productURL}`);
        
        const qrCodeDataURL = await QRCode.toDataURL(productURL, {
            width: 400,
            margin: 2,
            errorCorrectionLevel: 'H',
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        console.log(`✅ QR code created successfully`);
        
        res.json({
            success: true,
            productId: productId,
            qrCode: qrCodeDataURL,
            url: productURL,
            blockCount: history.length,
            scanNote: "Quét mã này từ điện thoại để xem lịch sử sản phẩm"
        });
    } catch (error) {
        console.error('❌ Lỗi tạo QR code:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo QR code',
            error: error.message
        });
    }
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