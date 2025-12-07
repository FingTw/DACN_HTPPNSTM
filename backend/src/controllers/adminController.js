// src/controllers/adminController.js
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import { Op } from "sequelize";

const models = initModels(sequelize);
const { taikhoan, cuahang, sanpham, donhang, vaitro, taikhoan_vaitro } = models;

const adminController = {
  // ==========================================
  // 1. THỐNG KÊ TỔNG QUAN (Dashboard)
  // ==========================================
  getSystemStats: async (req, res) => {
    try {
      // Tận dụng Model.count() và Model.sum() có sẵn của Sequelize
      const totalUsers = await taikhoan.count();
      const totalShops = await cuahang.count();
      const totalProducts = await sanpham.count();
      const totalOrders = await donhang.count();

      // Tính doanh thu (Chỉ tính đơn đã hoàn thành)
      const revenue = await donhang.sum("TongTien", {
        where: { TrangThai: "Hoàn thành" }, // Hoặc trạng thái tương đương trong DB bạn
      });

      // Lấy 5 đơn hàng mới nhất
      const recentOrders = await donhang.findAll({
        limit: 5,
        order: [["NgayTao", "DESC"]],
        attributes: ["MaDH", "TongTien", "TrangThai", "NgayTao", "MaTK"],
      });

      res.json({
        success: true,
        data: {
          totalUsers,
          totalShops,
          totalProducts,
          totalOrders,
          revenue: revenue || 0,
          recentOrders,
        },
      });
    } catch (err) {
      console.error("Lỗi thống kê admin:", err);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  // ==========================================
  // 2. QUẢN LÝ NGƯỜI DÙNG
  // ==========================================
  getAllUsers: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const offset = (page - 1) * limit;

      const whereCondition = {};
      if (search) {
        whereCondition[Op.or] = [
          { TenDangNhap: { [Op.like]: `%${search}%` } },
          { Email: { [Op.like]: `%${search}%` } },
          { HoTen: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await taikhoan.findAndCountAll({
        where: whereCondition,
        attributes: [
          "MaTK",
          "TenDangNhap",
          "Email",
          "HoTen",
          "SDT",
          "TrangThai",
          "NgayTao",
        ],
        include: [
          {
            model: taikhoan_vaitro,
            as: "taikhoan_vaitros",
            include: [{ model: vaitro, as: "vaitro", attributes: ["TenVT"] }],
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["NgayTao", "DESC"]],
      });

      // Format lại dữ liệu cho đẹp
      const formattedUsers = rows.map((user) => ({
        ...user.toJSON(),
        Role: user.taikhoan_vaitros?.[0]?.vaitro?.TenVT || "Khách Hàng",
      }));

      res.json({
        success: true,
        data: {
          users: formattedUsers,
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Khóa/Mở khóa tài khoản
  updateUserStatus: async (req, res) => {
    try {
      const { MaTK } = req.params;
      const { status } = req.body; // 'Hoạt động' hoặc 'Bị khóa'

      await taikhoan.update({ TrangThai: status }, { where: { MaTK } });

      res.json({
        success: true,
        message: `Đã cập nhật trạng thái thành ${status}`,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // ==========================================
  // 3. QUẢN LÝ CỬA HÀNG
  // ==========================================
  getAllShops: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const offset = (page - 1) * limit;

      const whereCondition = {};
      if (search) {
        whereCondition.TenCH = { [Op.like]: `%${search}%` };
      }

      const { count, rows } = await cuahang.findAndCountAll({
        where: whereCondition,
        include: [
          {
            model: taikhoan,
            as: "MaTK_taikhoan",
            attributes: ["HoTen", "Email", "TrangThai"], // Lấy trạng thái của chủ shop để biết shop active hay không
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["createdAt", "DESC"]], // Hoặc NgayTao nếu DB có trường này
      });

      // Format dữ liệu
      const formattedShops = await Promise.all(
        rows.map(async (shop) => {
          const productCount = await sanpham.count({
            where: { MaCH: shop.MaCH },
          });
          return {
            MaCH: shop.MaCH,
            TenCH: shop.TenCH,
            ChuSoHuu: shop.MaTK_taikhoan?.HoTen || "Unknown",
            Email: shop.MaTK_taikhoan?.Email,
            NgayTao: shop.dataValues.createdAt || new Date(), // Sửa lại trường ngày tạo cho đúng DB của bạn
            TrangThai:
              shop.MaTK_taikhoan?.TrangThai === "Hoạt động"
                ? "Active"
                : "Locked", // Logic: Chủ bị khóa -> Shop bị khóa
            SLSanPham: productCount,
          };
        })
      );

      res.json({
        success: true,
        data: {
          shops: formattedShops,
          total: count,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Duyệt/Khóa cửa hàng (Thực chất là khóa tài khoản chủ shop)
  updateShopStatus: async (req, res) => {
    try {
      const { MaCH } = req.params;
      const { status } = req.body; // 'Active' | 'Locked'

      // Tìm chủ shop
      const shop = await cuahang.findByPk(MaCH);
      if (!shop)
        return res.status(404).json({ message: "Không tìm thấy cửa hàng" });

      // Cập nhật trạng thái tài khoản chủ shop
      // 'Active' -> 'Hoạt động', 'Locked' -> 'Bị khóa'
      const userStatus = status === "Active" ? "Hoạt động" : "Bị khóa";

      await taikhoan.update(
        { TrangThai: userStatus },
        { where: { MaTK: shop.MaTK } }
      );

      res.json({
        success: true,
        message: `Đã cập nhật trạng thái cửa hàng thành ${status}`,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

export default adminController;
