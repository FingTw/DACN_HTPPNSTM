// src/controllers/storeRegistrationController.js
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import { Op } from "sequelize";
import jwt from "jsonwebtoken"; // 🟢 THÊM DÒNG NÀY
import dotenv from "dotenv"; // 🟢 THÊM DÒNG NÀY

dotenv.config(); // 🟢 THÊM DÒNG NÀY

const models = initModels(sequelize);
const { taikhoan, cuahang, hdbanhang, hinhanh, vaitro, taikhoan_vaitro } =
  models;

// 🟢 NOTE QUAN TRỌNG:
// - Controller này sử dụng JWT token từ header Authorization
// - Token được verify để lấy thông tin user (MaTK)
// - Mỗi user chỉ được đăng ký 1 gian hàng duy nhất
// - Tự động tạo cả gian hàng và hợp đồng bán hàng
// - Tự động chuyển role từ "Khách Hàng" thành "Chủ Cửa Hàng"

const storeRegistrationController = {
  // ==============================
  // 🏪 ĐĂNG KÝ GIAN HÀNG VÀ HỢP ĐỒNG
  // ==============================
  registerStore: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      // 🟢 LẤY VÀ XÁC THỰC JWT TOKEN
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        await transaction.rollback();
        return res.status(401).json({
          success: false,
          message: "Token không tồn tại. Vui lòng đăng nhập!",
        });
      }

      const token = authHeader.split(" ")[1];
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        await transaction.rollback();
        return res.status(401).json({
          success: false,
          message: "Token không hợp lệ hoặc đã hết hạn",
        });
      }

      const { MaTK } = decoded;
      const { TenCH, MaHA_CuaHang, LoaiHinhKD, MaSoThue, DCLayHang } = req.body;

      // 🟢 KIỂM TRA USER TỒN TẠI
      const user = await taikhoan.findByPk(MaTK, { transaction });
      if (!user) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tài khoản",
        });
      }

      // 🟢 KIỂM TRA USER ĐÃ CÓ CỬA HÀNG CHƯA
      const existingStore = await cuahang.findOne({
        where: { MaTK },
        transaction,
      });

      if (existingStore) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Bạn đã có cửa hàng rồi",
          data: {
            existingStore: {
              MaCH: existingStore.MaCH,
              TenCH: existingStore.TenCH,
            },
          },
        });
      }

      // 🟢 TẠO MÃ GIAN HÀNG TỰ ĐỘNG (Format: CHYYMM0001)
      const now = new Date();
      const storePrefix =
        "CH" +
        now.getFullYear().toString().slice(2) +
        String(now.getMonth() + 1).padStart(2, "0");

      const lastStore = await cuahang.findOne({
        where: { MaCH: { [Op.like]: `${storePrefix}%` } },
        order: [["MaCH", "DESC"]],
        transaction,
      });

      let newStoreId = storePrefix + "0001";
      if (lastStore) {
        const num = parseInt(lastStore.MaCH.slice(6)) + 1;
        newStoreId = storePrefix + num.toString().padStart(4, "0");
      }

      // 🟢 TẠO MÃ HỢP ĐỒNG TỰ ĐỘNG (Format: HDYYMM0001)
      const contractPrefix =
        "HD" +
        now.getFullYear().toString().slice(2) +
        String(now.getMonth() + 1).padStart(2, "0");

      const lastContract = await hdbanhang.findOne({
        where: { MaHD: { [Op.like]: `${contractPrefix}%` } },
        order: [["MaHD", "DESC"]],
        transaction,
      });

      let newContractId = contractPrefix + "0001";
      if (lastContract) {
        const num = parseInt(lastContract.MaHD.slice(6)) + 1;
        newContractId = contractPrefix + num.toString().padStart(4, "0");
      }

      // 🟢 KIỂM TRA HÌNH ẢNH ĐẠI DIỆN (nếu có)
      if (MaHA_CuaHang) {
        const existingImage = await hinhanh.findByPk(MaHA_CuaHang, {
          transaction,
        });
        if (!existingImage) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "Hình ảnh không tồn tại",
          });
        }
      }

      // 🟢 TẠO HỢP ĐỒNG BÁN HÀNG
      const newContract = await hdbanhang.create(
        {
          MaHD: newContractId,
          MaTK: MaTK,
          NgayLap: new Date(),
          LoaiHinhKD: LoaiHinhKD || "Bán lẻ",
          MaSoThue: MaSoThue || null,
          DCLayHang: DCLayHang || null,
        },
        { transaction }
      );

      // 🟢 TẠO GIAN HÀNG
      const newStore = await cuahang.create(
        {
          MaCH: newStoreId,
          TenCH,
          SLTheoDoi: 0,
          DiemDG: 0,
          MaHA_CuaHang: MaHA_CuaHang || null,
          MaTK: MaTK,
          MaHD: newContractId, // Liên kết với hợp đồng
        },
        { transaction }
      );

      // 🟢 CẬP NHẬT VAI TRÒ THÀNH CHỦ CỬA HÀNG
      const sellerRole = await vaitro.findOne({
        where: { TenVT: "Chủ Cửa Hàng" },
        transaction,
      });

      if (sellerRole) {
        // Xóa role khách hàng cũ (nếu có)
        await taikhoan_vaitro.destroy({
          where: { MaTK },
          transaction,
        });

        // Thêm role chủ cửa hàng
        await taikhoan_vaitro.create(
          {
            MaTK: MaTK,
            MaVT: sellerRole.MaVT,
          },
          { transaction }
        );
      }

      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: "Đăng ký gian hàng thành công",
        data: {
          store: {
            MaCH: newStore.MaCH,
            TenCH: newStore.TenCH,
            MaHA_CuaHang: newStore.MaHA_CuaHang,
          },
          contract: {
            MaHD: newContract.MaHD,
            LoaiHinhKD: newContract.LoaiHinhKD,
            NgayLap: newContract.NgayLap,
          },
        },
      });
    } catch (err) {
      await transaction.rollback();
      console.error("❌ Lỗi đăng ký gian hàng:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi server: " + err.message,
      });
    }
  },

  // ==============================
  // 📋 LẤY THÔNG TIN GIAN HÀNG VÀ HỢP ĐỒNG CỦA TÔI
  // ==============================
  getMyStoreInfo: async (req, res) => {
    try {
      // 🟢 LẤY VÀ XÁC THỰC JWT TOKEN
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Token không tồn tại. Vui lòng đăng nhập!",
        });
      }

      const token = authHeader.split(" ")[1];
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(401).json({
          success: false,
          message: "Token không hợp lệ hoặc đã hết hạn",
        });
      }

      const { MaTK } = decoded;

      const storeInfo = await cuahang.findOne({
        where: { MaTK },
        include: [
          {
            model: hdbanhang,
            attributes: [
              "MaHD",
              "NgayLap",
              "LoaiHinhKD",
              "MaSoThue",
              "DCLayHang",
            ],
          },
          {
            model: hinhanh,
            as: "MaHA_CuaHang_hinhanh",
            attributes: ["MaHA", "URL", "MoTa"],
          },
        ],
      });

      if (!storeInfo) {
        return res.status(404).json({
          success: false,
          message: "Bạn chưa có gian hàng",
        });
      }

      return res.json({
        success: true,
        message: "Lấy thông tin gian hàng thành công",
        data: storeInfo,
      });
    } catch (err) {
      console.error("❌ Lỗi lấy thông tin gian hàng:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi server: " + err.message,
      });
    }
  },

  // ==============================
  // ✏️ CẬP NHẬT THÔNG TIN HỢP ĐỒNG
  // ==============================
  updateContractInfo: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      // 🟢 LẤY VÀ XÁC THỰC JWT TOKEN
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        await transaction.rollback();
        return res.status(401).json({
          success: false,
          message: "Token không tồn tại. Vui lòng đăng nhập!",
        });
      }

      const token = authHeader.split(" ")[1];
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        await transaction.rollback();
        return res.status(401).json({
          success: false,
          message: "Token không hợp lệ hoặc đã hết hạn",
        });
      }

      const { MaTK } = decoded;
      const { LoaiHinhKD, MaSoThue, DCLayHang } = req.body;

      // 🟢 TÌM GIAN HÀNG CỦA USER
      const store = await cuahang.findOne({
        where: { MaTK },
        transaction,
      });

      if (!store) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Bạn chưa có gian hàng",
        });
      }

      // 🟢 CẬP NHẬT HỢP ĐỒNG
      const contract = await hdbanhang.findOne({
        where: { MaHD: store.MaHD },
        transaction,
      });

      if (!contract) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy hợp đồng",
        });
      }

      await contract.update(
        {
          LoaiHinhKD:
            LoaiHinhKD !== undefined ? LoaiHinhKD : contract.LoaiHinhKD,
          MaSoThue: MaSoThue !== undefined ? MaSoThue : contract.MaSoThue,
          DCLayHang: DCLayHang !== undefined ? DCLayHang : contract.DCLayHang,
        },
        { transaction }
      );

      await transaction.commit();

      return res.json({
        success: true,
        message: "Cập nhật thông tin hợp đồng thành công",
        data: contract,
      });
    } catch (err) {
      await transaction.rollback();
      console.error("❌ Lỗi cập nhật hợp đồng:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi server: " + err.message,
      });
    }
  },

  // ==============================
  // ✅ KIỂM TRA ĐIỀU KIỆN ĐĂNG KÝ GIAN HÀNG
  // ==============================
  checkEligibility: async (req, res) => {
    try {
      // 🟢 LẤY VÀ XÁC THỰC JWT TOKEN
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Token không tồn tại. Vui lòng đăng nhập!",
        });
      }

      const token = authHeader.split(" ")[1];
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(401).json({
          success: false,
          message: "Token không hợp lệ hoặc đã hết hạn",
        });
      }

      const { MaTK } = decoded;

      // 🟢 KIỂM TRA USER ĐÃ CÓ CỬA HÀNG CHƯA
      const existingStore = await cuahang.findOne({
        where: { MaTK },
      });

      if (existingStore) {
        return res.json({
          success: true,
          eligible: false,
          message: "Bạn đã có gian hàng",
          data: {
            existingStore: {
              MaCH: existingStore.MaCH,
              TenCH: existingStore.TenCH,
            },
          },
        });
      }

      return res.json({
        success: true,
        eligible: true,
        message: "Bạn có thể đăng ký gian hàng",
        data: null,
      });
    } catch (err) {
      console.error("❌ Lỗi kiểm tra điều kiện:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi server: " + err.message,
      });
    }
  },
};

export default storeRegistrationController;

// 🟢 NOTE TESTING TRONG POSTMAN:
/*
1. ĐĂNG NHẬP ĐỂ LẤY TOKEN:
   POST http://localhost:3000/api/auth/login
   Body: {"TenDangNhap": "user", "MatKhau": "pass"}

2. DÁN TOKEN VÀO AUTHORIZATION:
   Tab Authorization → Bearer Token → Dán token

3. KIỂM TRA ĐIỀU KIỆN:
   GET http://localhost:3000/api/store-registration/check-eligibility

4. ĐĂNG KÝ GIAN HÀNG:
   POST http://localhost:3000/api/store-registration/register
   Body: {
     "TenCH": "Cửa Hàng ABC",
     "LoaiHinhKD": "Bán lẻ",
     "MaSoThue": "0123456789",
     "DCLayHang": "123 Đường XYZ"
   }

5. XEM THÔNG TIN GIAN HÀNG:
   GET http://localhost:3000/api/store-registration/my-store
*/
