import dotenv from "dotenv";
dotenv.config();

const config = {
  db: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "nong_san_db",
    port: process.env.DB_PORT || 3306,
  },
  server: {
    port: process.env.PORT || 3000,
  },
};

export default config;
