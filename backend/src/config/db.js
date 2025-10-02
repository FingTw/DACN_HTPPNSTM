import { Sequelize } from "sequelize";
import config from "./config.js";

// Tạo instance Sequelize
const sequelize = new Sequelize(
  config.db.database,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    dialect: "mysql", // Sử dụng MySQL
    logging: false, // Tắt logging SQL query
  }
);

// Hàm kiểm tra kết nối
async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to MySQL via Sequelize");
  } catch (err) {
    console.error("❌ MySQL connection failed:", err);
    process.exit(1); // Thoát nếu kết nối thất bại
  }
}

// Đồng bộ database (tùy chọn, chỉ dùng khi cần tạo bảng tự động)
async function syncDB() {
  try {
    await sequelize.sync({ alter: true }); // Tự động cập nhật bảng theo model
    console.log("✅ Database synced");
  } catch (err) {
    console.error("❌ Database sync failed:", err);
  }
}

// Export sequelize mặc định và connectDB
export default sequelize;
export { connectDB, syncDB };
