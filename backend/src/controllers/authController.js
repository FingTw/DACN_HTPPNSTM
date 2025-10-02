// src/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import initModels from "../models/init-models.js";
import sequelize from "../config/db.js";

// khởi tạo models
const models = initModels(sequelize);
const { taikhoan, sanpham, donhang, vaitro, taikhoan_vaitro } = models;

import { sendEmail } from "../services/emailService.js";
import { Op } from "sequelize";

const authController = {
  // Đăng ký
  register: async (req, res) => {
    try {
      const { tendangnhap, email, matkhau } = req.body;

      if (!tendangnhap || !matkhau) {
        return res.status(400).json({
          message: "Tên đăng nhập và mật khẩu không được để trống",
        });
      }

      const existing = await taikhoan.findOne({ where: { tendangnhap } });
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
        where: { matk: { [Op.like]: `${prefix}%` } },
        order: [["matk", "DESC"]],
      });

      let newId = prefix + "0001";
      if (last) {
        const num = parseInt(last.matk.slice(6)) + 1;
        newId = prefix + num.toString().padStart(4, "0");
      }

      const hashPass = await bcrypt.hash(matkhau, 10);
      const newUser = await taikhoan.create({
        matk: newId,
        tendangnhap,
        email,
        matkhau: hashPass,
        ngaytao: new Date(),
        trangthai: "Hoạt động",
      });

      // gán role mặc định
      const khachRole = await vaitro.findOne({
        where: { tenvt: "Khách Hàng" },
      });
      if (khachRole) {
        await taikhoan_vaitro.create({
          matk: newUser.matk,
          mavt: khachRole.mavt,
        });
      }

      return res.json({ message: "Đăng ký thành công" });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  // Đăng nhập
  login: async (req, res) => {
    const { tendangnhap, matkhau } = req.body;
    const user = await Taikhoan.findOne({
      where: {
        [Op.or]: [{ tendangnhap }, { email: tendangnhap }],
      },
    });

    if (!user || !(await bcrypt.compare(matkhau, user.matkhau))) {
      return res
        .status(400)
        .json({ message: "Sai tên đăng nhập hoặc mật khẩu" });
    }

    // tạo JWT token
    const token = jwt.sign(
      { matk: user.matk, tendangnhap: user.tendangnhap },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    return res.json({ message: "Đăng nhập thành công", token });
  },

  // Đăng xuất
  logout: async (req, res) => {
    return res.json({ message: "Đăng xuất thành công (xóa token ở client)" });
  },

  //   // Quên mật khẩu
  //   forgotPassword: async (req, res) => {
  //     const { email } = req.body;
  //     const user = await Taikhoan.findOne({ where: { email } });
  //     if (!user) return res.status(404).json({ message: "Email không tồn tại" });

  //     const resetToken = crypto.randomBytes(32).toString("hex");
  //     await PasswordResetToken.create({
  //       matk: user.matk,
  //       resetToken,
  //       tokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
  //     });

  //     const link = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  //     await sendEmail(
  //       email,
  //       "Khôi phục mật khẩu",
  //       `Nhấn vào link để đặt lại mật khẩu: ${link}`
  //     );

  //     return res.json({ message: "Đã gửi email khôi phục mật khẩu" });
  //   },

  //   // Reset mật khẩu
  //   resetPassword: async (req, res) => {
  //     const { token, newPassword } = req.body;
  //     const reset = await PasswordResetToken.findOne({
  //       where: { resetToken: token },
  //     });

  //     if (!reset || reset.tokenExpiry < new Date()) {
  //       return res
  //         .status(400)
  //         .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  //     }

  //     const user = await Taikhoan.findByPk(reset.matk);
  //     user.matkhau = await bcrypt.hash(newPassword, 10);
  //     await user.save();
  //     await reset.destroy();

  //     return res.json({ message: "Đặt lại mật khẩu thành công" });
  //   },

  //   // Đổi mật khẩu
  //   changePassword: async (req, res) => {
  //     const { matk } = req.user; // lấy từ JWT middleware
  //     const { currentPassword, newPassword } = req.body;

  //     const user = await Taikhoan.findByPk(matk);
  //     if (!user)
  //       return res.status(404).json({ message: "Người dùng không tồn tại" });

  //     if (!(await bcrypt.compare(currentPassword, user.matkhau))) {
  //       return res.status(400).json({ message: "Mật khẩu cũ không chính xác" });
  //     }

  //     user.matkhau = await bcrypt.hash(newPassword, 10);
  //     await user.save();

  //     return res.json({ message: "Đổi mật khẩu thành công" });
  //   },
};

export default authController;
