import express from "express";
import cors from "cors";
import { connectDB, syncDB } from "./config/db.js";
import sequelize from "./config/db.js"; // Sử dụng instance đã export

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Hàm chính để khởi động ứng dụng
async function startServer() {
  // 1. Kết nối đến DB
  await connectDB();

  // 2. Import và Khởi tạo Models
  // Sử dụng Dynamic Import để xử lý module CommonJS
  const initModelsModule = await import("./models/init-models.js");

  // Kiểm tra và truy cập hàm initModels.
  // Do file là CJS, hàm chính thường nằm ở .default hoặc .initModels
  const initModels = initModelsModule.default || initModelsModule.initModels;

  if (typeof initModels !== "function") {
    console.error("Lỗi: Không tìm thấy hàm initModels trong module.");
    return;
  }

  // Khởi tạo các Models (models chứa các đối tượng Model đã được liên kết)
  const models = initModels(sequelize);

  // 3. Đồng bộ Database (nếu cần)
  await syncDB();

  // (Tại đây, bạn có thể truyền models vào các controller hoặc router nếu cần)
  // Ví dụ: app.use('/api/sanpham', sanphamRouter(models.sanpham));

  // 4. Khởi động server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Chạy hàm chính
startServer().catch((err) => {
  console.error("Lỗi Fatal khi khởi động Server:", err);
  process.exit(1);
});
