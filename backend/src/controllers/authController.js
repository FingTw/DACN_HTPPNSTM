// src/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import dotenv from "dotenv";
  dotenv.config();

// khởi tạo models
const models = initModels(sequelize);
// console.log(models);
// console.log(models.taikhoan);
// console.log("JWT_SECRET:", process.env.JWT_SECRET);


const { taikhoan, sanpham, donhang, vaitro, taikhoan_vaitro, password_reset_token, hinhanh } = models;

import { sendEmail } from "../services/emailService.js";
import { Op } from "sequelize";

const authController = {
  // ==============================
  // Cập nhật thông tin cá nhân
  // ==============================
  updatePersonalInfo: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Không có token" });
      }

      const token = authHeader.split(" ")[1];
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Token không hợp lệ" });
      }

      const { MaTK } = decoded; // lấy từ token hoặc body khi test
      const { HoTen, SDT, Email, TenDangNhap, AvtURL, AvtMoTa, AvtMaHA } = req.body;

      const account = await taikhoan.findByPk(MaTK);
      if (!account) {
        return res.status(404).json({ message: "Không tìm thấy tài khoản" });
      }

      // ==========================
      // Xử lý ảnh đại diện
      // ==========================
      if (AvtMaHA) {
        // Nếu client gửi sẵn mã ảnh
        const avatar = await hinhanh.findByPk(AvtMaHA);
        if (!avatar) {
          return res.status(400).json({ message: `Không tìm thấy ảnh với mã ${AvtMaHA}` });
        }
        account.MaHA_Avatar = AvtMaHA;
      } else if (AvtURL) {
        // Nếu client gửi URL mới => tạo bản ghi ảnh mới
        const now = new Date();
        const prefix = "HA" + now.getFullYear().toString().slice(2) + String(now.getMonth() + 1).padStart(2, "0");

        const lastImage = await hinhanh.findOne({
          where: { MaHA: { [Op.like]: `${prefix}%` } },
          order: [["MaHA", "DESC"]],
        });

        let newId = prefix + "0001";
        if (lastImage) {
          const num = parseInt(lastImage.MaHA.slice(6)) + 1;
          newId = prefix + num.toString().padStart(4, "0");
        }

        const newImage = await hinhanh.create({
          MaHA: newId,
          URL: AvtURL,
          MoTa: AvtMoTa || null,
        });

        account.MaHA_Avatar = newImage.MaHA;
      }

      // ==========================
      // Cập nhật các trường khác
      // ==========================
      if (HoTen !== undefined) account.HoTen = HoTen;
      if (SDT !== undefined) account.SDT = SDT;
      if (Email !== undefined) account.Email = Email;
      if (TenDangNhap !== undefined) account.TenDangNhap = TenDangNhap;

      await account.save();

      return res.json({
        message: "Cập nhật thông tin cá nhân thành công",
        data: account,
      });
    } catch (err) {
      console.error("❌ Lỗi cập nhật thông tin:", err);
      return res.status(500).json({ message: err.message });
    }
  },

  // Đăng ký
  register: async (req, res) => {
    try {
      const { TenDangNhap, Email, MatKhau } = req.body;

      if (!TenDangNhap || !MatKhau) {
        return res.status(400).json({
          message: "Tên đăng nhập và mật khẩu không được để trống",
        });
      }

      const existing = await taikhoan.findOne({ where: { TenDangNhap } });
      if (existing) {
        return res
          .status(400)
          .json({ message: "Tên đăng nhập hoặc email đã tồn tại" });
      }

      // sinh mã tài khoản
      const now = new Date();
      const prefix =
        "TK" +
        now.getFullYear().toString().slice(2) +
        String(now.getMonth() + 1).padStart(2, "0");

      const last = await taikhoan.findOne({
        where: { MaTK: { [Op.like]: `${prefix}%` } },
        order: [["MaTK", "DESC"]],
      });

      let newId = prefix + "0001";
      if (last) {
        const num = parseInt(last.MaTK.slice(6)) + 1;
        newId = prefix + num.toString().padStart(4, "0");
      }

      const hashPass = await bcrypt.hash(MatKhau, 10);
      const newUser = await taikhoan.create({
        MaTK: newId,
        TenDangNhap,
        Email,
        MatKhau: hashPass,
        NgayTao: new Date(),
        TrangThai: "Hoạt động",
      });

      // gán role mặc định
      const khachRole = await vaitro.findOne({
        where: { TenVT: "Khách Hàng" },
      });
      if (khachRole) {
        await taikhoan_vaitro.create({
          MaTK: newUser.MaTK,
          MaVT: khachRole.MaVT,
        });
      }

      return res.json({ message: "Đăng ký thành công" });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  // Đăng nhập
  login: async (req, res) => {
  try {
    const { TenDangNhap, MatKhau } = req.body;

    if (!TenDangNhap || !MatKhau)
      return res.status(400).json({ message: "Thiếu tên đăng nhập hoặc mật khẩu" });

    const user = await taikhoan.findOne({
      where: {
        [Op.or]: [
          { TenDangNhap: TenDangNhap },
          { Email: TenDangNhap }
        ]
      }
    });

    if (!user)
      return res.status(401).json({ message: "Sai tên đăng nhập hoặc mật khẩu" });

    const isMatch = await bcrypt.compare(MatKhau, user.MatKhau);
    // const isMatch = MatKhau === user.MatKhau;
    if (!isMatch)
      return res.status(401).json({ message: "Sai tên đăng nhập hoặc mật khẩu" });

    const token = jwt.sign(
      { MaTK: user.MaTK, TenDangNhap: user.TenDangNhap },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({ message: "Đăng nhập thành công", token });
  } catch (err) {
    console.error("Lỗi login:", err);
    return res.status(500).json({ message: err.message });
  }
}
,


  // Đăng xuất
  logout: async (req, res) => {
    return res.json({ message: "Đăng xuất thành công (xóa token ở client)" });
  },

    // Quên mật khẩu
    forgotPassword: async (req, res) => {
      const { Email } = req.body;
      const user = await taikhoan.findOne({ where: { Email } });
      if (!user) return res.status(404).json({ message: "Email không tồn tại" });

      const resetToken = crypto.randomBytes(32).toString("hex");

      await password_reset_token.create({
        MaTK: user.MaTK,
        resetToken,
        tokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
      });

      const link = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      await sendEmail(
        Email,
        "Khôi phục mật khẩu",
        `Nhấn vào link để đặt lại mật khẩu: ${link}`
      );

      return res.json({ message: "Đã gửi email khôi phục mật khẩu" });
    },

    // Reset mật khẩu
    resetPassword: async (req, res) => {
      const { token, newPassword } = req.body;

      const reset = await password_reset_token.findOne({
        where: { resetToken: token },
      });

      if (!reset || reset.tokenExpiry < new Date()) {
        return res
          .status(400)
          .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
      }

      const user = await taikhoan.findByPk(reset.MaTK);
      if (!user) {
        return res.status(404).json({ message: "Tài khoản không tồn tại" });
      }

      user.MatKhau = await bcrypt.hash(newPassword, 10);

      await user.save();
      await reset.destroy();

      return res.json({ message: "Đặt lại mật khẩu thành công" });
    },

    // Đổi mật khẩu
    changePassword: async (req, res) => {
       // Lấy token trực tiếp từ header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "Thiếu token" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const { MaTK } = decoded; // lấy từ JWT middleware
      const { currentPassword, newPassword } = req.body;

      const user = await taikhoan.findByPk(MaTK);
      if (!user)
        return res.status(404).json({ message: "Người dùng không tồn tại" });

      if (!(await bcrypt.compare(currentPassword, user.MatKhau))) {
        return res.status(400).json({ message: "Mật khẩu cũ không chính xác" });
      }

      user.MatKhau = await bcrypt.hash(newPassword, 10);
      await user.save();

      return res.json({ message: "Đổi mật khẩu thành công" });
    },
};

export default authController;
