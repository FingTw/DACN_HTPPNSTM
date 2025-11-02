// controllers/danhGiaSanPhamController.js
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Op } from "sequelize";

dotenv.config();

const models = initModels(sequelize);
const { danhgiasanpham, sanpham, cuahang, taikhoan } = models;

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

// 🟢 HÀM TẠO MÃ ĐÁNH GIÁ UNIQUE - PHIÊN BẢN MỚI HOÀN TOÀN
const generateMaDG = async (transaction = null) => {
  try {
    // Sử dụng timestamp + random để đảm bảo luôn unique
    const timestamp = Date.now(); // 13 số
    const random = Math.floor(Math.random() * 10000); // 4 số
    const newMaDG = `DG${timestamp}${random}`;

    console.log(`🔹 Tạo mã mới: ${newMaDG}`);

    // Kiểm tra trùng (an toàn kép)
    const existing = await danhgiasanpham.findByPk(newMaDG, { transaction });
    if (!existing) {
      return newMaDG;
    }

    // Nếu trùng (rất hiếm), tạo mã mới với random khác
    console.log(`⚠️ Mã ${newMaDG} trùng, tạo mã mới...`);
    const fallbackMaDG = `DGFB${Date.now()}${Math.floor(
      Math.random() * 100000
    )}`;
    console.log(`🔹 Sử dụng mã fallback: ${fallbackMaDG}`);

    return fallbackMaDG;
  } catch (error) {
    console.error("❌ Lỗi tạo mã đánh giá:", error);
    // Fallback cuối cùng
    const emergencyMaDG = `DGEM${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    console.log(`🔹 Sử dụng mã emergency: ${emergencyMaDG}`);
    return emergencyMaDG;
  }
};

// 🟢 SERVICE TÍNH ĐIỂM ĐÁNH GIÁ
class DanhGiaSanPhamService {
  // CẬP NHẬT ĐIỂM TRUNG BÌNH SẢN PHẨM
  static async capNhatDiemSanPham(MaSP, transaction = null) {
    try {
      const options = transaction ? { transaction } : {};

      // Tính điểm trung bình và số lượng đánh giá
      const thongKe = await danhgiasanpham.findAll({
        where: {
          MaSP,
          HieuLuc: true,
        },
        attributes: [
          [sequelize.fn("AVG", sequelize.col("Diem")), "diemTrungBinh"],
          [sequelize.fn("COUNT", sequelize.col("MaDG")), "soLuongDanhGia"],
        ],
        ...options,
      });

      const diemTrungBinh = parseFloat(thongKe[0]?.get("diemTrungBinh") || 0);
      const soLuongDanhGia = parseInt(thongKe[0]?.get("soLuongDanhGia") || 0);

      // Cập nhật vào sản phẩm
      await sanpham.update(
        {
          DiemDG_SP: Math.round(diemTrungBinh * 10) / 10,
          SoLuongDanhGia_SP: soLuongDanhGia,
        },
        {
          where: { MaSP },
          ...options,
        }
      );

      return {
        diemTrungBinh: Math.round(diemTrungBinh * 10) / 10,
        soLuongDanhGia,
      };
    } catch (error) {
      console.error("❌ Lỗi cập nhật điểm sản phẩm:", error);
      throw error;
    }
  }

  // LẤY THỐNG KÊ ĐÁNH GIÁ
  static async getThongKeDanhGia(MaSP) {
    try {
      const thongKeDiem = await danhgiasanpham.findAll({
        where: { MaSP, HieuLuc: true },
        attributes: [
          "Diem",
          [sequelize.fn("COUNT", sequelize.col("Diem")), "soLuong"],
        ],
        group: ["Diem"],
        order: [["Diem", "DESC"]],
      });

      const thongKeDaMua = await danhgiasanpham.findAll({
        where: { MaSP, HieuLuc: true },
        attributes: [
          "DaMua",
          [sequelize.fn("COUNT", sequelize.col("DaMua")), "soLuong"],
        ],
        group: ["DaMua"],
      });

      const tongDanhGia = await danhgiasanpham.count({
        where: { MaSP, HieuLuc: true },
      });

      return {
        thongKeDiem,
        thongKeDaMua,
        tongDanhGia,
      };
    } catch (error) {
      console.error("❌ Lỗi lấy thống kê đánh giá:", error);
      throw error;
    }
  }
}

// ⭐ THÊM ĐÁNH GIÁ SẢN PHẨM MỚI
export const createDanhGiaSanPham = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    // 🟢 XÁC THỰC USER
    const user = await authenticateUser(req);

    const { MaSP } = req.params;
    const { Diem, NoiDung, DaMua = false } = req.body;

    // 🟢 KIỂM TRA SẢN PHẨM TỒN TẠI
    const product = await sanpham.findByPk(MaSP, { transaction });
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    // 🟢 KIỂM TRA USER KHÔNG PHẢI CHỦ SẢN PHẨM
    const store = await cuahang.findByPk(product.MaCH, { transaction });
    if (store.MaTK === user.MaTK) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Bạn không thể đánh giá sản phẩm của chính mình",
      });
    }

    // 🟢 KIỂM TRA ĐÃ ĐÁNH GIÁ CHƯA
    const existingReview = await danhgiasanpham.findOne({
      where: { MaSP, MaTK: user.MaTK, HieuLuc: true },
      transaction,
    });

    if (existingReview) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Bạn đã đánh giá sản phẩm này rồi",
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

    // 🟢 TẠO MÃ ĐÁNH GIÁ TỰ ĐỘNG (SỬ DỤNG HÀM MỚI)
    const newReviewId = await generateMaDG(transaction);
    console.log(`✅ Mã đánh giá đã tạo: ${newReviewId}`);

    // 🟢 KIỂM TRA TRÙNG LẦN CUỐI (an toàn kép)
    const finalCheck = await danhgiasanpham.findByPk(newReviewId, {
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
    const newReview = await danhgiasanpham.create(
      {
        MaDG: newReviewId,
        MaSP,
        MaTK: user.MaTK,
        Diem,
        NoiDung: NoiDung || null,
        DaMua: Boolean(DaMua),
        NgayDG: new Date(),
        HieuLuc: true,
      },
      { transaction }
    );

    // 🟢 CẬP NHẬT ĐIỂM TRUNG BÌNH CHO SẢN PHẨM
    const thongKe = await DanhGiaSanPhamService.capNhatDiemSanPham(
      MaSP,
      transaction
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Đánh giá sản phẩm thành công",
      data: {
        danhGia: newReview,
        thongKe: thongKe,
      },
    });
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Lỗi tạo đánh giá sản phẩm:", err);

    if (err.message.includes("Token")) {
      return res.status(401).json({
        success: false,
        message: err.message,
      });
    }

    // Xử lý lỗi duplicate entry cụ thể
    if (err.name === "SequelizeUniqueConstraintError") {
      console.error("❌ Lỗi trùng mã chi tiết:", err);
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

// 📋 LẤY DANH SÁCH ĐÁNH GIÁ SẢN PHẨM
export const getDanhGiaSanPham = async (req, res) => {
  try {
    const { MaSP } = req.params;
    const { page = 1, limit = 10, sort = "newest", filter = "all" } = req.query;

    // 🟢 KIỂM TRA SẢN PHẨM TỒN TẠI
    const product = await sanpham.findByPk(MaSP);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    const offset = (page - 1) * limit;
    let whereCondition = { MaSP, HieuLuc: true };
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

    // 🟢 LỌC
    if (filter === "purchased") {
      whereCondition.DaMua = true;
    } else if (filter === "with_content") {
      whereCondition.NoiDung = { [Op.ne]: null };
    } else if (filter !== "all") {
      whereCondition.Diem = parseInt(filter);
    }

    // 🟢 SỬA LỖI: SỬ DỤNG ĐÚNG ALIAS 'nguoidanhgia'
    const { count, rows: danhGia } = await danhgiasanpham.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: taikhoan,
          as: "nguoidanhgia", // 🟢 SỬA THÀNH 'nguoidanhgia' thay vì 'taikhoan'
          attributes: ["MaTK", "TenDangNhap", "Email"],
        },
      ],
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    // 🟢 THỐNG KÊ ĐÁNH GIÁ
    const thongKe = await DanhGiaSanPhamService.getThongKeDanhGia(MaSP);

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

    const soLuongDaMua =
      thongKe.thongKeDaMua
        .find((item) => item.DaMua === true)
        ?.get("soLuong") || 0;

    res.json({
      success: true,
      message: "Lấy danh sách đánh giá sản phẩm thành công",
      data: {
        thongTinSanPham: {
          MaSP: product.MaSP,
          TenSP: product.TenSP,
          DiemDG_SP: product.DiemDG_SP,
          SoLuongDanhGia_SP: product.SoLuongDanhGia_SP,
        },
        thongKe: {
          tongDanhGia: count,
          daMuaHang: parseInt(soLuongDaMua),
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
    console.error("❌ Lỗi lấy danh sách đánh giá sản phẩm:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// ✏️ CẬP NHẬT ĐÁNH GIÁ CỦA TÔI
export const updateDanhGiaSanPham = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const user = await authenticateUser(req);

    const { MaDG } = req.params;
    const { Diem, NoiDung, DaMua } = req.body;

    // 🟢 TÌM ĐÁNH GIÁ
    const danhGia = await danhgiasanpham.findByPk(MaDG, { transaction });
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
        DaMua: DaMua !== undefined ? Boolean(DaMua) : danhGia.DaMua,
      },
      { transaction }
    );

    // 🟢 CẬP NHẬT LẠI ĐIỂM TRUNG BÌNH CHO SẢN PHẨM
    const thongKe = await DanhGiaSanPhamService.capNhatDiemSanPham(
      danhGia.MaSP,
      transaction
    );

    await transaction.commit();

    res.json({
      success: true,
      message: "Cập nhật đánh giá sản phẩm thành công",
      data: {
        danhGia,
        thongKe: thongKe,
      },
    });
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Lỗi cập nhật đánh giá sản phẩm:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 🗑️ XÓA ĐÁNH GIÁ CỦA TÔI
export const deleteDanhGiaSanPham = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const user = await authenticateUser(req);

    const { MaDG } = req.params;

    // 🟢 TÌM ĐÁNH GIÁ
    const danhGia = await danhgiasanpham.findByPk(MaDG, { transaction });
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

    const maSP = danhGia.MaSP;

    // 🟢 XÓA ĐÁNH GIÁ (đánh dấu không hiệu lực)
    await danhGia.update({ HieuLuc: false }, { transaction });

    // 🟢 CẬP NHẬT LẠI ĐIỂM TRUNG BÌNH CHO SẢN PHẨM
    const thongKe = await DanhGiaSanPhamService.capNhatDiemSanPham(
      maSP,
      transaction
    );

    await transaction.commit();

    res.json({
      success: true,
      message: "Xóa đánh giá sản phẩm thành công",
      data: {
        thongKe: thongKe,
      },
    });
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Lỗi xóa đánh giá sản phẩm:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 👀 LẤY ĐÁNH GIÁ CỦA TÔI CHO SẢN PHẨM
export const getMyDanhGiaForSanPham = async (req, res) => {
  try {
    const user = await authenticateUser(req);

    const { MaSP } = req.params;

    const danhGia = await danhgiasanpham.findOne({
      where: { MaSP, MaTK: user.MaTK, HieuLuc: true },
      include: [
        {
          model: sanpham,
          attributes: ["MaSP", "TenSP", "GiaBan"],
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
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 📊 LẤY THỐNG KÊ ĐÁNH GIÁ SẢN PHẨM
export const getThongKeDanhGiaSanPham = async (req, res) => {
  try {
    const { MaSP } = req.params;

    // 🟢 KIỂM TRA SẢN PHẨM TỒN TẠI
    const product = await sanpham.findByPk(MaSP);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    const thongKe = await DanhGiaSanPhamService.getThongKeDanhGia(MaSP);

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

    const soLuongDaMua =
      thongKe.thongKeDaMua
        .find((item) => item.DaMua === true)
        ?.get("soLuong") || 0;

    res.json({
      success: true,
      message: "Lấy thống kê đánh giá thành công",
      data: {
        thongTinSanPham: {
          MaSP: product.MaSP,
          TenSP: product.TenSP,
          DiemDG_SP: product.DiemDG_SP,
          SoLuongDanhGia_SP: product.SoLuongDanhGia_SP,
        },
        thongKe: {
          tongDanhGia: thongKe.tongDanhGia,
          daMuaHang: parseInt(soLuongDaMua),
          thongKeChiTiet,
        },
      },
    });
  } catch (err) {
    console.error("❌ Lỗi lấy thống kê đánh giá:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};
