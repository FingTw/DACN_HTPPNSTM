// controllers/danhGiaCuaHangController.js
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Op } from "sequelize";

dotenv.config();

const models = initModels(sequelize);
const { danhgiacuahang, cuahang, taikhoan } = models;

// 🟢 HÀM XÁC THỰC JWT
const authenticateUser = async (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Token không tồn tại. Vui lòng đăng nhập!");
  }

  const token = authHeader.split(" ")[1];
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new Error("Token không hợp lệ hoặc đã hết hạn");
  }

  const user = await taikhoan.findByPk(decoded.MaTK, {
    attributes: ["MaTK", "TenDangNhap", "Email", "TrangThai"],
  });

  if (!user) {
    throw new Error("Tài khoản không tồn tại");
  }

  if (user.TrangThai !== "Hoạt động") {
    throw new Error("Tài khoản đã bị khóa");
  }

  return {
    MaTK: user.MaTK,
    TenDangNhap: user.TenDangNhap,
    Email: user.Email,
  };
};

// 🟢 HÀM TẠO MÃ ĐÁNH GIÁ UNIQUE
const generateMaDG = async (transaction = null) => {
  try {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const newMaDG = `DGCH${timestamp}${random}`;

    console.log(`🔹 Tạo mã đánh giá cửa hàng: ${newMaDG}`);

    const existing = await danhgiacuahang.findByPk(newMaDG, { transaction });
    if (!existing) {
      return newMaDG;
    }

    console.log(`⚠️ Mã ${newMaDG} trùng, tạo mã mới...`);
    const newTimestamp = (Date.now() + 1).toString().slice(-8);
    const fallbackMaDG = `DGCH${newTimestamp}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`;

    console.log(`🔹 Mã fallback: ${fallbackMaDG}`);
    return fallbackMaDG;
  } catch (error) {
    console.error("❌ Lỗi tạo mã đánh giá cửa hàng:", error);
    const emergencyMaDG = `DGEM${Date.now().toString().slice(-10)}`;
    console.log(`🔹 Sử dụng mã emergency: ${emergencyMaDG}`);
    return emergencyMaDG;
  }
};

// 🟢 SERVICE TÍNH ĐIỂM ĐÁNH GIÁ CỬA HÀNG - ĐÃ SỬA
class DanhGiaCuaHangService {
  // CẬP NHẬT ĐIỂM TRUNG BÌNH CỬA HÀNG
  static async capNhatDiemCuaHang(MaCH, transaction = null) {
    try {
      const options = transaction ? { transaction } : {};

      // Tính điểm trung bình và số lượng đánh giá
      const thongKe = await danhgiacuahang.findAll({
        where: { MaCH },
        attributes: [
          [sequelize.fn("AVG", sequelize.col("Diem")), "diemTrungBinh"],
          [sequelize.fn("COUNT", sequelize.col("MaDG")), "soLuongDanhGia"],
        ],
        ...options,
      });

      const diemTrungBinh = parseFloat(thongKe[0]?.get("diemTrungBinh") || 0);
      const soLuongDanhGia = parseInt(thongKe[0]?.get("soLuongDanhGia") || 0);

      console.log(`📊 Cập nhật điểm cửa hàng ${MaCH}:`, {
        diemTrungBinh,
        soLuongDanhGia,
      });

      // 🟢 SỬA LỖI: Cập nhật đúng tên cột trong database
      await cuahang.update(
        {
          DiemDG: Math.round(diemTrungBinh * 10) / 10, // Sửa DiemDG_CH → DiemDG
          SLDanhGia: soLuongDanhGia, // Sửa SoLuongDanhGia_CH → SLDanhGia
        },
        {
          where: { MaCH },
          ...options,
        }
      );

      return {
        diemTrungBinh: Math.round(diemTrungBinh * 10) / 10,
        soLuongDanhGia,
      };
    } catch (error) {
      console.error("❌ Lỗi cập nhật điểm cửa hàng:", error);
      throw error;
    }
  }

  // LẤY THỐNG KÊ ĐÁNH GIÁ CỬA HÀNG
  static async getThongKeDanhGia(MaCH) {
    try {
      const thongKeDiem = await danhgiacuahang.findAll({
        where: { MaCH },
        attributes: [
          "Diem",
          [sequelize.fn("COUNT", sequelize.col("Diem")), "soLuong"],
        ],
        group: ["Diem"],
        order: [["Diem", "DESC"]],
      });

      const tongDanhGia = await danhgiacuahang.count({
        where: { MaCH },
      });

      return {
        thongKeDiem,
        tongDanhGia,
      };
    } catch (error) {
      console.error("❌ Lỗi lấy thống kê đánh giá cửa hàng:", error);
      throw error;
    }
  }
}

// ⭐ THÊM ĐÁNH GIÁ CỬA HÀNG MỚI
export const createDanhGiaCuaHang = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    // 🟢 XÁC THỰC USER
    const user = await authenticateUser(req);

    const { MaCH } = req.params;
    const { Diem, NoiDung } = req.body;

    // 🟢 KIỂM TRA CỬA HÀNG TỒN TẠI
    const store = await cuahang.findByPk(MaCH, { transaction });
    if (!store) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cửa hàng",
      });
    }

    // 🟢 KIỂM TRA USER KHÔNG PHẢI CHỦ CỬA HÀNG
    if (store.MaTK === user.MaTK) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Bạn không thể đánh giá cửa hàng của chính mình",
      });
    }

    // 🟢 KIỂM TRA ĐÃ ĐÁNH GIÁ CHƯA
    const existingReview = await danhgiacuahang.findOne({
      where: { MaCH, MaTK: user.MaTK },
      transaction,
    });

    if (existingReview) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Bạn đã đánh giá cửa hàng này rồi",
      });
    }

    // 🟢 KIỂM TRA ĐIỂM HỢP LỆ (1-5)
    if (Diem < 1 || Diem > 5) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Điểm đánh giá phải từ 1 đến 5 sao",
      });
    }

    // 🟢 TẠO MÃ ĐÁNH GIÁ TỰ ĐỘNG
    const newReviewId = await generateMaDG(transaction);
    console.log(`✅ Mã đánh giá cửa hàng đã tạo: ${newReviewId}`);

    // 🟢 KIỂM TRA TRÙNG LẦN CUỐI
    const finalCheck = await danhgiacuahang.findByPk(newReviewId, {
      transaction,
    });
    if (finalCheck) {
      console.error(`❌ LỖI NGHIÊM TRỌNG: Mã ${newReviewId} đã tồn tại!`);
      await transaction.rollback();
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống: không thể tạo mã đánh giá duy nhất",
      });
    }

    console.log(
      `✅ Kiểm tra mã ${newReviewId} - OK, tiến hành tạo đánh giá...`
    );

    // 🟢 TẠO ĐÁNH GIÁ MỚI
    const newReview = await danhgiacuahang.create(
      {
        MaDG: newReviewId,
        MaCH,
        MaTK: user.MaTK,
        Diem,
        NoiDung: NoiDung || null,
        NgayDG: new Date(),
      },
      { transaction }
    );

    // 🟢 CẬP NHẬT ĐIỂM TRUNG BÌNH CHO CỬA HÀNG
    const thongKe = await DanhGiaCuaHangService.capNhatDiemCuaHang(
      MaCH,
      transaction
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Đánh giá cửa hàng thành công",
      data: {
        danhGia: newReview,
        thongKe: thongKe,
      },
    });
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Lỗi tạo đánh giá cửa hàng:", err);

    if (err.message.includes("Token")) {
      return res.status(401).json({
        success: false,
        message: err.message,
      });
    }

    if (err.name === "SequelizeUniqueConstraintError") {
      console.error("❌ Lỗi trùng mã đánh giá cửa hàng:", err);
      return res.status(400).json({
        success: false,
        message: "Lỗi trùng mã đánh giá. Vui lòng thử lại.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 📋 LẤY DANH SÁCH ĐÁNH GIÁ CỬA HÀNG - ĐÃ SỬA
export const getDanhGiaCuaHang = async (req, res) => {
  try {
    const { MaCH } = req.params;
    const { page = 1, limit = 10, sort = "newest" } = req.query;

    // 🟢 KIỂM TRA CỬA HÀNG TỒN TẠI
    const store = await cuahang.findByPk(MaCH);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cửa hàng",
      });
    }

    const offset = (page - 1) * limit;
    let order = [["NgayDG", "DESC"]];

    // 🟢 SẮP XẾP
    if (sort === "oldest") {
      order = [["NgayDG", "ASC"]];
    } else if (sort === "highest") {
      order = [
        ["Diem", "DESC"],
        ["NgayDG", "DESC"],
      ];
    } else if (sort === "lowest") {
      order = [
        ["Diem", "ASC"],
        ["NgayDG", "DESC"],
      ];
    }

    const { count, rows: danhGia } = await danhgiacuahang.findAndCountAll({
      where: { MaCH },
      include: [
        {
          model: taikhoan,
          attributes: ["MaTK", "TenDangNhap", "Email"],
        },
      ],
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // 🟢 THỐNG KÊ ĐÁNH GIÁ
    const thongKe = await DanhGiaCuaHangService.getThongKeDanhGia(MaCH);

    // 🟢 TÍNH PHẦN TRĂM TỪNG MỨC ĐIỂM
    const thongKeChiTiet = thongKe.thongKeDiem.map((item) => ({
      diem: item.Diem,
      soLuong: parseInt(item.get("soLuong")),
      phanTram:
        thongKe.tongDanhGia > 0
          ? Math.round(
              (parseInt(item.get("soLuong")) / thongKe.tongDanhGia) * 100
            )
          : 0,
    }));

    res.json({
      success: true,
      message: "Lấy danh sách đánh giá cửa hàng thành công",
      data: {
        thongTinCuaHang: {
          MaCH: store.MaCH,
          TenCH: store.TenCH,
          DiemDG_CH: store.DiemDG || 0, // 🟢 SỬA: store.DiemDG_CH → store.DiemDG
          SoLuongDanhGia_CH: store.SLDanhGia || 0, // 🟢 SỬA: store.SoLuongDanhGia_CH → store.SLDanhGia
        },
        thongKe: {
          tongDanhGia: count,
          thongKeChiTiet,
        },
        danhGia: {
          items: danhGia,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalItems: count,
            totalPages: Math.ceil(count / limit),
          },
        },
      },
    });
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách đánh giá cửa hàng:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// ✏️ CẬP NHẬT ĐÁNH GIÁ CỦA TÔI
export const updateDanhGiaCuaHang = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    // 🟢 XÁC THỰC USER
    const user = await authenticateUser(req);

    const { MaDG } = req.params;
    const { Diem, NoiDung } = req.body;

    // 🟢 TÌM ĐÁNH GIÁ
    const danhGia = await danhgiacuahang.findByPk(MaDG, { transaction });
    if (!danhGia) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá",
      });
    }

    // 🟢 KIỂM TRA QUYỀN SỞ HỮU
    if (danhGia.MaTK !== user.MaTK) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền chỉnh sửa đánh giá này",
      });
    }

    // 🟢 KIỂM TRA ĐIỂM HỢP LỆ
    if (Diem && (Diem < 1 || Diem > 5)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Điểm đánh giá phải từ 1 đến 5",
      });
    }

    // 🟢 CẬP NHẬT ĐÁNH GIÁ
    await danhGia.update(
      {
        Diem: Diem !== undefined ? Diem : danhGia.Diem,
        NoiDung: NoiDung !== undefined ? NoiDung : danhGia.NoiDung,
      },
      { transaction }
    );

    // 🟢 CẬP NHẬT LẠI ĐIỂM TRUNG BÌNH CHO CỬA HÀNG
    const thongKe = await DanhGiaCuaHangService.capNhatDiemCuaHang(
      danhGia.MaCH,
      transaction
    );

    await transaction.commit();

    res.json({
      success: true,
      message: "Cập nhật đánh giá cửa hàng thành công",
      data: {
        danhGia,
        thongKe: thongKe,
      },
    });
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Lỗi cập nhật đánh giá cửa hàng:", err);

    if (err.message.includes("Token")) {
      return res.status(401).json({
        success: false,
        message: err.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 🗑️ XÓA ĐÁNH GIÁ CỦA TÔI
export const deleteDanhGiaCuaHang = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    // 🟢 XÁC THỰC USER
    const user = await authenticateUser(req);

    const { MaDG } = req.params;

    // 🟢 TÌM ĐÁNH GIÁ
    const danhGia = await danhgiacuahang.findByPk(MaDG, { transaction });
    if (!danhGia) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá",
      });
    }

    // 🟢 KIỂM TRA QUYỀN SỞ HỮU
    if (danhGia.MaTK !== user.MaTK) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa đánh giá này",
      });
    }

    const maCH = danhGia.MaCH;

    // 🟢 XÓA ĐÁNH GIÁ
    await danhGia.destroy({ transaction });

    // 🟢 CẬP NHẬT LẠI ĐIỂM TRUNG BÌNH CHO CỬA HÀNG
    const thongKe = await DanhGiaCuaHangService.capNhatDiemCuaHang(
      maCH,
      transaction
    );

    await transaction.commit();

    res.json({
      success: true,
      message: "Xóa đánh giá cửa hàng thành công",
      data: {
        thongKe: thongKe,
      },
    });
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Lỗi xóa đánh giá cửa hàng:", err);

    if (err.message.includes("Token")) {
      return res.status(401).json({
        success: false,
        message: err.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 👀 LẤY ĐÁNH GIÁ CỦA TÔI CHO CỬA HÀNG
export const getMyDanhGiaForCuaHang = async (req, res) => {
  try {
    // 🟢 XÁC THỰC USER
    const user = await authenticateUser(req);

    const { MaCH } = req.params;

    const danhGia = await danhgiacuahang.findOne({
      where: { MaCH, MaTK: user.MaTK },
      include: [
        {
          model: cuahang,
          attributes: ["MaCH", "TenCH", "DiemDG", "SLDanhGia"], // 🟢 SỬA: Thêm DiemDG, SLDanhGia
        },
        {
          model: taikhoan,
          attributes: ["MaTK", "TenDangNhap"],
        },
      ],
    });

    res.json({
      success: true,
      message: "Lấy đánh giá của bạn thành công",
      data: danhGia,
    });
  } catch (err) {
    console.error("❌ Lỗi lấy đánh giá của bạn:", err);

    if (err.message.includes("Token")) {
      return res.status(401).json({
        success: false,
        message: err.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 📊 LẤY THỐNG KÊ ĐÁNH GIÁ CỬA HÀNG - ĐÃ SỬA
export const getThongKeDanhGiaCuaHang = async (req, res) => {
  try {
    const { MaCH } = req.params;

    // 🟢 KIỂM TRA CỬA HÀNG TỒN TẠI
    const store = await cuahang.findByPk(MaCH);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cửa hàng",
      });
    }

    const thongKe = await DanhGiaCuaHangService.getThongKeDanhGia(MaCH);

    // 🟢 TÍNH PHẦN TRĂM
    const thongKeChiTiet = thongKe.thongKeDiem.map((item) => ({
      diem: item.Diem,
      soLuong: parseInt(item.get("soLuong")),
      phanTram:
        thongKe.tongDanhGia > 0
          ? Math.round(
              (parseInt(item.get("soLuong")) / thongKe.tongDanhGia) * 100
            )
          : 0,
    }));

    res.json({
      success: true,
      message: "Lấy thống kê đánh giá thành công",
      data: {
        thongTinCuaHang: {
          MaCH: store.MaCH,
          TenCH: store.TenCH,
          DiemDG_CH: store.DiemDG || 0, // 🟢 SỬA: store.DiemDG_CH → store.DiemDG
          SoLuongDanhGia_CH: store.SLDanhGia || 0, // 🟢 SỬA: store.SoLuongDanhGia_CH → store.SLDanhGia
        },
        thongKe: {
          tongDanhGia: thongKe.tongDanhGia,
          thongKeChiTiet,
        },
      },
    });
  } catch (err) {
    console.error("❌ Lỗi lấy thống kê đánh giá cửa hàng:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 📈 LẤY TẤT CẢ ĐÁNH GIÁ CỦA TÔI - ĐÃ SỬA
export const getAllMyDanhGiaCuaHang = async (req, res) => {
  try {
    // 🟢 XÁC THỰC USER
    const user = await authenticateUser(req);

    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: danhGia } = await danhgiacuahang.findAndCountAll({
      where: { MaTK: user.MaTK },
      include: [
        {
          model: cuahang,
          attributes: ["MaCH", "TenCH", "DiemDG", "SLDanhGia"], // 🟢 SỬA: Thêm DiemDG, SLDanhGia
        },
      ],
      order: [["NgayDG", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      message: "Lấy danh sách đánh giá của bạn thành công",
      data: {
        danhGia: {
          items: danhGia,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalItems: count,
            totalPages: Math.ceil(count / limit),
          },
        },
      },
    });
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách đánh giá của bạn:", err);

    if (err.message.includes("Token")) {
      return res.status(401).json({
        success: false,
        message: err.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

export default {
  createDanhGiaCuaHang,
  getDanhGiaCuaHang,
  updateDanhGiaCuaHang,
  deleteDanhGiaCuaHang,
  getMyDanhGiaForCuaHang,
  getThongKeDanhGiaCuaHang,
  getAllMyDanhGiaCuaHang,
};
