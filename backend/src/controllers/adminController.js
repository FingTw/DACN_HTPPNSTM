// src/controllers/adminController.js
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import { Op } from "sequelize";
import bcrypt from "bcryptjs";

const models = initModels(sequelize);
const {
  taikhoan,
  cuahang,
  sanpham,
  donhang,
  vaitro,
  taikhoan_vaitro,
  nhanvien,
  phongban,
  chucvu,
  danhmuc,
  kho,
} = models;

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

  getMetaData: async (req, res) => {
    try {
      const listRoles = await vaitro.findAll();
      const listPositions = await chucvu.findAll();
      res.json({
        success: true,
        data: { roles: listRoles, positions: listPositions },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Lấy chi tiết user kèm roles và thông tin nhân viên (nếu có)
  getUserDetail: async (req, res) => {
    try {
      const { MaTK } = req.params;
      const user = await taikhoan.findOne({
        where: { MaTK },
        include: [
          {
            model: taikhoan_vaitro,
            as: "taikhoan_vaitros",
            include: [{ model: vaitro, as: "vaitro" }],
          },
        ],
      });

      const empInfo = await nhanvien.findOne({ where: { MaNV: MaTK } });

      if (!user) return res.status(404).json({ message: "User not found" });

      res.json({
        success: true,
        data: {
          ...user.toJSON(),
          Roles: user.taikhoan_vaitros.map((tv) => tv.vaitro.MaVT), // Trả về mảng các MaVT
          EmployeeInfo: empInfo, // Trả về MaCV nếu có
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Tạo tài khoản mới (Admin tạo)
  createUser: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { TenDangNhap, MatKhau, Email, HoTen, Roles, MaCV } = req.body; // Roles là mảng ['admin', 'staff']

      // 1. Tạo tài khoản
      const hashPassword = await bcrypt.hash(MatKhau, 10);
      const newMaTK = "TK" + Date.now().toString().slice(-8); // Logic tạo mã tạm

      const newUser = await taikhoan.create(
        {
          MaTK: newMaTK,
          TenDangNhap,
          MatKhau: hashPassword,
          Email,
          HoTen,
          TrangThai: "Hoạt động",
          NgayTao: new Date(),
        },
        { transaction: t }
      );

      // 2. Gán vai trò (Bulk Create)
      if (Roles && Roles.length > 0) {
        const roleData = Roles.map((maVT) => ({
          MaTK: newMaTK,
          MaVT: maVT,
        }));
        await taikhoan_vaitro.bulkCreate(roleData, { transaction: t });
      }

      // 3. Nếu có vai trò Nhân Viên và có chọn Chức Vụ -> Tạo thông tin nhân viên
      // Giả sử mã vai trò nhân viên là 'NV' hoặc check trong list Roles
      if (MaCV) {
        await nhanvien.create(
          {
            MaNV: newMaTK, // Dùng luôn MaTK làm MaNV
            HoTen: HoTen,
            Email: Email,
            MaCV: MaCV,
          },
          { transaction: t }
        );
      }

      await t.commit();
      res.json({ success: true, message: "Tạo tài khoản thành công" });
    } catch (err) {
      await t.rollback();
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Xóa tài khoản
  deleteUser: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { MaTK } = req.params;

      // Xóa các bảng phụ trước (nhanvien, taikhoan_vaitro)
      await nhanvien.destroy({ where: { MaNV: MaTK }, transaction: t });
      await taikhoan_vaitro.destroy({ where: { MaTK }, transaction: t });
      await taikhoan.destroy({ where: { MaTK }, transaction: t });

      await t.commit();
      res.json({ success: true, message: "Đã xóa tài khoản" });
    } catch (err) {
      await t.rollback();
      res
        .status(500)
        .json({ success: false, message: "Lỗi xóa user: " + err.message });
    }
  },

  updateUserFull: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { MaTK } = req.params;
      const { HoTen, Email, TrangThai, Roles, MaCV } = req.body;
      // Roles: Mảng MaVT mới (VD: ['ADMIN', 'SHIPPER'])

      // 1. Update bảng Taikhoan
      await taikhoan.update(
        { HoTen, Email, TrangThai },
        { where: { MaTK }, transaction: t }
      );

      if (Roles) {
        await taikhoan_vaitro.destroy({ where: { MaTK }, transaction: t });

        const roleData = Roles.map((maVT) => ({
          MaTK: MaTK,
          MaVT: maVT,
        }));
        await taikhoan_vaitro.bulkCreate(roleData, { transaction: t });
      }

      // 3. Xử lý Nhân Viên (Nếu user này được gán chức vụ)
      if (MaCV) {
        const emp = await nhanvien.findOne({
          where: { MaNV: MaTK },
          transaction: t,
        });
        if (emp) {
          await nhanvien.update(
            { MaCV: MaCV },
            { where: { MaNV: MaTK }, transaction: t }
          );
        } else {
          await nhanvien.create(
            {
              MaNV: MaTK,
              HoTen: HoTen,
              Email: Email,
              MaCV: MaCV,
            },
            { transaction: t }
          );
        }
      } else {
      }

      await t.commit();
      res.json({ success: true, message: "Cập nhật thành công" });
    } catch (err) {
      await t.rollback();
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
            as: "MaTK_taikhoan", // Đảm bảo alias này đúng với init-models.js
            attributes: ["HoTen", "Email", "TrangThai"],
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        // 👇 SỬA LỖI Ở ĐÂY: Đổi 'createdAt' thành 'MaCH'
        order: [["MaCH", "DESC"]],
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
            // 👇 SỬA LỖI Ở ĐÂY: Vì không có createdAt, ta có thể lấy ngày từ Hợp đồng (nếu join) hoặc để tạm thời gian hiện tại
            NgayTao: new Date().toISOString(),
            TrangThai:
              shop.MaTK_taikhoan?.TrangThai === "Hoạt động"
                ? "Active"
                : "Locked",
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
      console.error("Lỗi lấy danh sách shop:", err); // Log lỗi ra terminal để dễ debug
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

  // ==========================================
  // 4. QUẢN LÝ PHÒNG BAN
  // ==========================================
  getAllDepartments: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const offset = (page - 1) * limit;

      const whereCondition = {};
      if (search) {
        whereCondition.TenPB = { [Op.like]: `%${search}%` };
      }

      const { count, rows } = await phongban.findAndCountAll({
        where: whereCondition,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["MaPB", "ASC"]],
      });

      res.json({
        success: true,
        data: {
          departments: rows,
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  createDepartment: async (req, res) => {
    try {
      const { TenPB, MoTa } = req.body;

      if (!TenPB)
        return res.status(400).json({ message: "Tên phòng ban là bắt buộc" });

      const newMaPB = "PB" + Date.now().toString().slice(-8);
      const newDept = await phongban.create({
        MaPB: newMaPB,
        TenPB,
        MoTa,
      });

      res.json({
        success: true,
        message: "Tạo phòng ban thành công",
        data: newDept,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  updateDepartment: async (req, res) => {
    try {
      const { MaPB } = req.params;
      const { TenPB, MoTa } = req.body;

      const dept = await phongban.findByPk(MaPB);
      if (!dept)
        return res.status(404).json({ message: "Phòng ban không tồn tại" });

      await phongban.update({ TenPB, MoTa }, { where: { MaPB } });

      res.json({
        success: true,
        message: "Cập nhật phòng ban thành công",
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  deleteDepartment: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { MaPB } = req.params;

      // Kiểm tra có nhân viên nào đang ở phòng ban này không
      const empCount = await nhanvien.count({
        where: { MaPB },
      });

      if (empCount > 0) {
        return res.status(400).json({
          message:
            "Không thể xóa phòng ban có nhân viên, vui lòng chuyển nhân viên sang phòng ban khác trước",
        });
      }

      await phongban.destroy({ where: { MaPB }, transaction: t });
      await t.commit();

      res.json({
        success: true,
        message: "Xóa phòng ban thành công",
      });
    } catch (err) {
      await t.rollback();
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // ==========================================
  // 5. QUẢN LÝ CHỨC VỤ
  // ==========================================
  getAllPositions: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const offset = (page - 1) * limit;

      const whereCondition = {};
      if (search) {
        whereCondition.TenCV = { [Op.like]: `%${search}%` };
      }

      const { count, rows } = await chucvu.findAndCountAll({
        where: whereCondition,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["MaCV", "ASC"]],
      });

      res.json({
        success: true,
        data: {
          positions: rows,
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  createPosition: async (req, res) => {
    try {
      const { TenCV, MoTa } = req.body;

      if (!TenCV)
        return res.status(400).json({ message: "Tên chức vụ là bắt buộc" });

      const newMaCV = "CV" + Date.now().toString().slice(-8);
      const newPos = await chucvu.create({
        MaCV: newMaCV,
        TenCV,
        MoTa,
      });

      res.json({
        success: true,
        message: "Tạo chức vụ thành công",
        data: newPos,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  updatePosition: async (req, res) => {
    try {
      const { MaCV } = req.params;
      const { TenCV, MoTa } = req.body;

      const pos = await chucvu.findByPk(MaCV);
      if (!pos)
        return res.status(404).json({ message: "Chức vụ không tồn tại" });

      await chucvu.update({ TenCV, MoTa }, { where: { MaCV } });

      res.json({
        success: true,
        message: "Cập nhật chức vụ thành công",
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  deletePosition: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { MaCV } = req.params;

      // Kiểm tra có nhân viên nào đang có chức vụ này không
      const empCount = await nhanvien.count({
        where: { MaCV },
      });

      if (empCount > 0) {
        return res.status(400).json({
          message:
            "Không thể xóa chức vụ có nhân viên, vui lòng chuyển chức vụ nhân viên trước",
        });
      }

      await chucvu.destroy({ where: { MaCV }, transaction: t });
      await t.commit();

      res.json({
        success: true,
        message: "Xóa chức vụ thành công",
      });
    } catch (err) {
      await t.rollback();
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // ==========================================
  // 6. QUẢN LÝ DANH MỤC
  // ==========================================
  getAllCategories: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const offset = (page - 1) * limit;

      const whereCondition = {};
      if (search) {
        whereCondition.TenDM = { [Op.like]: `%${search}%` };
      }

      const { count, rows } = await danhmuc.findAndCountAll({
        where: whereCondition,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["MaDM", "ASC"]],
      });

      res.json({
        success: true,
        data: {
          categories: rows,
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  createCategory: async (req, res) => {
    try {
      const { TenDM, MoTa } = req.body;

      if (!TenDM)
        return res.status(400).json({ message: "Tên danh mục là bắt buộc" });

      const newMaDM = "DM" + Date.now().toString().slice(-8);
      const newCat = await danhmuc.create({
        MaDM: newMaDM,
        TenDM,
        MoTa,
      });

      res.json({
        success: true,
        message: "Tạo danh mục thành công",
        data: newCat,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  updateCategory: async (req, res) => {
    try {
      const { MaDM } = req.params;
      const { TenDM, MoTa } = req.body;

      const cat = await danhmuc.findByPk(MaDM);
      if (!cat)
        return res.status(404).json({ message: "Danh mục không tồn tại" });

      await danhmuc.update({ TenDM, MoTa }, { where: { MaDM } });

      res.json({
        success: true,
        message: "Cập nhật danh mục thành công",
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  deleteCategory: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { MaDM } = req.params;

      // Kiểm tra có sản phẩm nào trong danh mục này không
      const productCount = await sanpham.count({
        where: { MaDM },
      });

      if (productCount > 0) {
        return res.status(400).json({
          message:
            "Không thể xóa danh mục có sản phẩm, vui lòng chuyển/xóa sản phẩm trước",
        });
      }

      await danhmuc.destroy({ where: { MaDM }, transaction: t });
      await t.commit();

      res.json({
        success: true,
        message: "Xóa danh mục thành công",
      });
    } catch (err) {
      await t.rollback();
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // ==========================================
  // 7. QUẢN LÝ KHO BÃI
  // ==========================================
  getAllWarehouses: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const offset = (page - 1) * limit;

      const whereCondition = {};
      if (search) {
        whereCondition[Op.or] = [
          { TenKho: { [Op.like]: `%${search}%` } },
          { DC: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await kho.findAndCountAll({
        where: whereCondition,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["MaKho", "ASC"]],
      });

      res.json({
        success: true,
        data: {
          warehouses: rows,
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  createWarehouse: async (req, res) => {
    try {
      const { TenKho, DC, SucChua } = req.body;

      if (!TenKho || !DC)
        return res.status(400).json({
          message: "Tên kho và địa chỉ là bắt buộc",
        });

      const newMaKho = "KHO" + Date.now().toString().slice(-7);
      const newWarehouse = await kho.create({
        MaKho: newMaKho,
        TenKho,
        DC,
        SucChua,
      });

      res.json({
        success: true,
        message: "Tạo kho bãi thành công",
        data: newWarehouse,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  updateWarehouse: async (req, res) => {
    try {
      const { MaKho } = req.params;
      const { TenKho, DC, SucChua } = req.body;

      const warehouse = await kho.findByPk(MaKho);
      if (!warehouse)
        return res.status(404).json({ message: "Kho bãi không tồn tại" });

      await kho.update({ TenKho, DC, SucChua }, { where: { MaKho } });

      res.json({
        success: true,
        message: "Cập nhật kho bãi thành công",
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  deleteWarehouse: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { MaKho } = req.params;

      // Kiểm tra có hàng trong kho không
      // (Tùy thuộc vào cách bạn thiết kế, có thể check trong model khác liên kết với kho)
      await kho.destroy({ where: { MaKho }, transaction: t });
      await t.commit();

      res.json({
        success: true,
        message: "Xóa kho bãi thành công",
      });
    } catch (err) {
      await t.rollback();
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // ==========================================
  // 8. QUẢN LÝ NHÂN VIÊN (Cập nhật chi tiết)
  // ==========================================
  getAllEmployees: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const offset = (page - 1) * limit;

      const whereCondition = {};
      if (search) {
        whereCondition[Op.or] = [
          { HoTen: { [Op.like]: `%${search}%` } },
          { Email: { [Op.like]: `%${search}%` } },
          { MaNV: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await nhanvien.findAndCountAll({
        where: whereCondition,
        include: [
          {
            model: phongban,
            as: "MaPB_phongban",
            attributes: ["TenPB"],
          },
          {
            model: chucvu,
            as: "MaCV_chucvu",
            attributes: ["TenCV"],
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["MaNV", "ASC"]],
      });

      res.json({
        success: true,
        data: {
          employees: rows,
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getEmployeeDetail: async (req, res) => {
    try {
      const { MaNV } = req.params;

      const employee = await nhanvien.findOne({
        where: { MaNV },
        include: [
          {
            model: phongban,
            as: "MaPB_phongban",
            attributes: ["MaPB", "TenPB"],
          },
          {
            model: chucvu,
            as: "MaCV_chucvu",
            attributes: ["MaCV", "TenCV"],
          },
        ],
      });

      if (!employee)
        return res.status(404).json({ message: "Nhân viên không tồn tại" });

      // Lấy thông tin tài khoản liên kết
      const userInfo = await taikhoan.findOne({
        where: { MaTK: MaNV },
        attributes: ["MaTK", "TenDangNhap", "Email", "HoTen", "TrangThai"],
      });

      res.json({
        success: true,
        data: {
          ...employee.toJSON(),
          TaiKhoan: userInfo,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  updateEmployeeInfo: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { MaNV } = req.params;
      const { HoTen, SDT, Email, MaPB, MaCV } = req.body;

      const employee = await nhanvien.findByPk(MaNV, { transaction: t });

      if (employee) {
        // Cập nhật thông tin nhân viên
        await nhanvien.update(
          { HoTen, SDT, Email, MaPB, MaCV },
          { where: { MaNV }, transaction: t }
        );
      } else {
        // Tạo mới record nhân viên liên kết với tài khoản
        await nhanvien.create(
          { MaNV, HoTen, SDT, Email, MaPB, MaCV },
          { transaction: t }
        );
      }

      // Đồng bộ thông tin Hiển thị lên bảng taikhoan (tên, email)
      await taikhoan.update(
        { HoTen, Email },
        { where: { MaTK: MaNV }, transaction: t }
      );

      await t.commit();

      res.json({
        success: true,
        message: "Cập nhật thông tin nhân viên thành công",
      });
    } catch (err) {
      await t.rollback();
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

export default adminController;
