import express from "express";
import cors from "cors";
import { connectDB, syncDB } from "./config/db.js";
import sequelize from "./config/db.js"; // Sử dụng instance đã export
import initModels from "./models/init-models.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Khởi tạo Sequelize và model
await connectDB(); // Chỉ kiểm tra kết nối, không gán biến
const models = initModels(sequelize); // Truyền đúng instance Sequelize
await syncDB(); // Đồng bộ database (tạo bảng nếu chưa có)

// // Route ví dụ để kiểm tra model Chitiet_donhang
// app.get("/chitiet_donhang", async (req, res) => {
//   try {
//     const chitiet = await models.chitiet_donhang.findAll({
//       include: [
//         { model: models.donhang, as: "MaDH_donhang" },
//         { model: models.sanpham, as: "MaSP_sanpham" },
//       ],
//     });
//     res.json(chitiet);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
