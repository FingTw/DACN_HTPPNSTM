// controllers/sanphamController.js
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Op } from "sequelize";

dotenv.config();

const models = initModels(sequelize);
const {
  sanpham,
  cuahang,
  taikhoan,
  hinhanh,
  sanpham_hinhanh,
  sanpham_danhmuc,
  danhmuc,
  danhgiasanpham,
} = models;

// 🟢 HÀM XÁC THỰC JWT (CẢI THIỆN)
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

  // Kiểm tra user có tồn tại trong database không
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

// 🟢 Lấy tất cả sản phẩm - CÓ PHÂN TRANG VÀ LỌC
export const getAllSanpham = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      minPrice,
      maxPrice,
      minRating,
      include,
    } = req.query;

    const offset = (page - 1) * limit;
    let whereCondition = {};
    let includeOptions = [];

    // 🟢 TÌM KIẾM THEO TÊN
    if (search) {
      whereCondition.TenSP = {
        [Op.like]: `%${search}%`,
      };
    }

    // 🟢 LỌC THEO GIÁ
    if (minPrice !== undefined || maxPrice !== undefined) {
      whereCondition.GiaBan = {};
      if (minPrice !== undefined)
        whereCondition.GiaBan[Op.gte] = parseFloat(minPrice);
      if (maxPrice !== undefined)
        whereCondition.GiaBan[Op.lte] = parseFloat(maxPrice);
    }

    // 🟢 LỌC THEO ĐIỂM ĐÁNH GIÁ
    if (minRating !== undefined) {
      whereCondition.DiemDG_SP = {
        [Op.gte]: parseFloat(minRating),
      };
    }

    // 🟢 INCLUDE OPTIONS
    if (include) {
      const includes = include.split(",");

      if (includes.includes("cuahang")) {
        includeOptions.push({
          model: cuahang,
          as: "cuahang",
          attributes: ["MaCH", "TenCH", "DiemDG", "SLTheoDoi"],
        });
      }

      if (includes.includes("hinhanh")) {
        includeOptions.push({
          model: hinhanh,
          as: "hinhanhs", // ← PHẢI KHỚP VỚI as trong init-models
          attributes: ["MaHA", "URL", "MoTa"],
          through: { attributes: [] },
        });
      }

      if (includes.includes("danhmuc")) {
        includeOptions.push({
          model: danhmuc,
          as: "sanpham_danhmucs", // ← FIX TƯƠNG TỰ, KHỚP AS
          attributes: ["MaDM", "TenDM"],
          through: { attributes: [] },
        });
      }

      if (includes.includes("danhgia")) {
        includeOptions.push({
          model: danhgiasanpham,
          as: "danhgias", // ← FIX: THÊM AS NẾU LÀ HASMANY
          attributes: ["MaDG", "Diem", "NoiDung", "NgayDG", "HieuLuc"],
          include: [
            {
              model: taikhoan,
              as: "nguoidanhgia",
              attributes: ["MaTK", "TenDangNhap"],
            },
          ],
          where: { HieuLuc: true }, // Optional: Lọc đánh giá hợp lệ
          required: false, // Không bắt buộc nếu sản phẩm chưa có đánh giá
        });
      }
    }
    const { count, rows: data } = await sanpham.findAndCountAll({
      where: whereCondition,
      include: includeOptions,
      order: [["MaSP", "ASC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      message: "Lấy danh sách sản phẩm thành công",
      data: {
        products: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalItems: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách sản phẩm:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

export const getSanphamById = async (req, res) => {
  try {
    const { MaSP } = req.params;
    const { include } = req.query;

    let includeOptions = [
      {
        model: cuahang,
        as: "cuahang",
        attributes: ["MaCH", "TenCH", "DiemDG", "SLTheoDoi"],
      },
    ];

    if (include) {
      const includes = include.split(",");

      if (includes.includes("hinhanh")) {
        includeOptions.push({
          model: hinhanh,
          as: "hinhanhs", // ← CŨNG PHẢI KHỚP
          attributes: ["MaHA", "URL", "MoTa"],
          through: { attributes: [] },
        });
      }

      if (includes.includes("danhmuc")) {
        includeOptions.push({
          model: sanpham_danhmuc,
          as: "sanpham_danhmucs",
          include: [
            {
              model: danhmuc,
              attributes: ["MaDM", "TenDM"],
            },
          ],
        });
      }

      // ĐÁNH GIÁ SẢN PHẨM
      if (includes.includes("danhgia")) {
        includeOptions.push({
          model: danhgiasanpham,
          as: "danhgias",
          attributes: ["MaDG", "Diem", "NoiDung", "NgayDG", "HieuLuc"],
          include: [
            {
              model: taikhoan,
              attributes: ["MaTK", "TenDangNhap"],
            },
          ],
          where: { HieuLuc: true }, // Optional
          required: false, // Không bắt buộc nếu sản phẩm chưa có đánh giá
        });
      }
    }

    const item = await sanpham.findByPk(MaSP, {
      include: includeOptions,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    res.json({
      success: true,
      message: "Lấy thông tin sản phẩm thành công",
      data: item,
    });
  } catch (err) {
    console.error("❌ Lỗi lấy thông tin sản phẩm:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 🟢 Lấy sản phẩm theo cửa hàng
export const getSanphamByCuaHang = async (req, res) => {
  try {
    const { MaCH } = req.params;
    const { page = 1, limit = 10, include } = req.query;
    const offset = (page - 1) * limit;

    // Kiểm tra cửa hàng tồn tại
    const cuaHang = await cuahang.findByPk(MaCH);
    if (!cuaHang) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cửa hàng",
      });
    }

    let includeOptions = [];
    if (include && include.includes("hinhanh")) {
      includeOptions.push({
        model: sanpham_hinhanh,
        include: [
          {
            model: hinhanh,
            attributes: ["MaHA", "URL", "MoTa"],
          },
        ],
      });
    }

    const { count, rows: data } = await sanpham.findAndCountAll({
      where: { MaCH },
      include: includeOptions,
      order: [["TenSP", "ASC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      message: "Lấy danh sách sản phẩm theo cửa hàng thành công",
      data: {
        store: {
          MaCH: cuaHang.MaCH,
          TenCH: cuaHang.TenCH,
        },
        products: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalItems: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (err) {
    console.error("❌ Lỗi lấy sản phẩm theo cửa hàng:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 🟢 Thêm sản phẩm - CẢI THIỆN VALIDATION
export const createSanpham = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    console.log("📦 Creating product with data:", req.body);

    // 🟢 XÁC THỰC USER
    const user = await authenticateUser(req);
    console.log(`👤 Authenticated user: ${user.MaTK}`);

    // Tìm cửa hàng của user
    const cuaHang = await cuahang.findOne({
      where: { MaTK: user.MaTK },
      transaction,
    });

    if (!cuaHang) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Bạn không có cửa hàng",
      });
    }

    const { TenSP, MoTa, DVT, HSD, TrangThai, GiaBan, NguonGoc, SLTon } =
      req.body;

    // 🟢 VALIDATION CƠ BẢN
    if (!TenSP || TenSP.trim() === "") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Tên sản phẩm không được để trống",
      });
    }

    if (GiaBan && GiaBan < 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Giá bán không được âm",
      });
    }

    if (SLTon && SLTon < 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Số lượng tồn không được âm",
      });
    }

    // 🟢 TẠO MÃ SẢN PHẨM TỰ ĐỘNG
    const now = new Date();
    const productPrefix =
      "SP" +
      now.getFullYear().toString().slice(2) +
      String(now.getMonth() + 1).padStart(2, "0");

    const lastProduct = await sanpham.findOne({
      where: { MaSP: { [Op.like]: `${productPrefix}%` } },
      order: [["MaSP", "DESC"]],
      transaction,
    });

    let newProductId = productPrefix + "0001";
    if (lastProduct) {
      const num = parseInt(lastProduct.MaSP.slice(6)) + 1;
      newProductId = productPrefix + num.toString().padStart(4, "0");
    }

    // Tạo sản phẩm mới
    const newProduct = await sanpham.create(
      {
        MaSP: newProductId,
        MaCH: cuaHang.MaCH,
        TenSP: TenSP.trim(),
        MoTa: MoTa || null,
        DVT: DVT || null,
        HSD: HSD || null,
        TrangThai: TrangThai || "Đang bán",
        GiaBan: GiaBan || 0,
        NguonGoc: NguonGoc || null,
        SLTon: SLTon || 0,
        DiemDG_SP: 0,
        SoLuongDanhGia_SP: 0,
      },
      { transaction }
    );

    await transaction.commit();

    console.log("✅ Product created successfully:", newProduct.MaSP);

    res.status(201).json({
      success: true,
      message: "Tạo sản phẩm thành công",
      data: newProduct,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Lỗi tạo sản phẩm:", err);

    if (err.message.includes("Token")) {
      return res.status(401).json({
        success: false,
        message: err.message,
      });
    }

    if (err.name === "SequelizeValidationError") {
      const validationErrors = err.errors.map((error) => ({
        field: error.path,
        message: error.message,
      }));
      return res.status(400).json({
        success: false,
        message: "Lỗi validation dữ liệu",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 🟢 Cập nhật sản phẩm - CẢI THIỆN
export const updateSanpham = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { MaSP } = req.params;

    // 🟢 XÁC THỰC USER
    const user = await authenticateUser(req);

    // Tìm sản phẩm
    const item = await sanpham.findByPk(MaSP, { transaction });
    if (!item) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    // Tìm cửa hàng của user
    const cuaHang = await cuahang.findOne({
      where: { MaTK: user.MaTK },
      transaction,
    });

    if (!cuaHang) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Bạn không có cửa hàng",
      });
    }

    // 🚨 KIỂM TRA QUYỀN SỞ HỮU
    if (item.MaCH !== cuaHang.MaCH) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật sản phẩm này",
      });
    }

    // 🟢 VALIDATION DỮ LIỆU CẬP NHẬT
    const { TenSP, GiaBan, SLTon } = req.body;

    if (TenSP !== undefined && TenSP.trim() === "") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Tên sản phẩm không được để trống",
      });
    }

    if (GiaBan !== undefined && GiaBan < 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Giá bán không được âm",
      });
    }

    if (SLTon !== undefined && SLTon < 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Số lượng tồn không được âm",
      });
    }

    // Cập nhật sản phẩm
    await item.update(req.body, { transaction });
    await transaction.commit();

    res.json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
      data: item,
    });
  } catch (err) {
    await transaction.rollback();

    if (err.message.includes("Token")) {
      return res.status(401).json({
        success: false,
        message: err.message,
      });
    }

    console.error("❌ Lỗi cập nhật sản phẩm:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 🟢 Xóa sản phẩm - GIỮ NGUYÊN (ĐÃ TỐT)
export const deleteSanpham = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { MaSP } = req.params;

    // 🟢 XÁC THỰC USER
    const user = await authenticateUser(req);

    // Tìm sản phẩm
    const item = await sanpham.findByPk(MaSP, { transaction });
    if (!item) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    // 🚨 KHÔNG CHO XÓA SẢN PHẨM KHÔNG CÓ CỬA HÀNG
    if (item.MaCH === null) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Không thể xóa sản phẩm hệ thống",
      });
    }

    // Tìm cửa hàng của user
    const cuaHang = await cuahang.findOne({
      where: { MaTK: user.MaTK },
      transaction,
    });

    if (!cuaHang) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Bạn không có cửa hàng",
      });
    }

    // 🚨 KIỂM TRA QUYỀN SỞ HỮU
    if (item.MaCH !== cuaHang.MaCH) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa sản phẩm này",
      });
    }

    // Xóa dữ liệu liên quan
    if (sanpham_danhmuc) {
      await sanpham_danhmuc.destroy({
        where: { MaSP: MaSP },
        transaction,
      });
    }

    if (sanpham_hinhanh) {
      await sanpham_hinhanh.destroy({
        where: { MaSP: MaSP },
        transaction,
      });
    }

    // Xóa đánh giá sản phẩm
    if (danhgiasanpham) {
      await danhgiasanpham.destroy({
        where: { MaSP: MaSP },
        transaction,
      });
    }

    // Xóa sản phẩm
    await item.destroy({ transaction });
    await transaction.commit();

    res.json({
      success: true,
      message: "Xóa sản phẩm thành công",
      data: {
        deletedProduct: MaSP,
        store: cuaHang.MaCH,
      },
    });
  } catch (err) {
    await transaction.rollback();

    if (err.message.includes("Token")) {
      return res.status(401).json({
        success: false,
        message: err.message,
      });
    }

    console.error("❌ Lỗi xóa sản phẩm:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 🟢 Lấy sản phẩm của cửa hàng tôi - CẢI THIỆN
export const getMySanpham = async (req, res) => {
  try {
    // 🟢 XÁC THỰC USER
    const user = await authenticateUser(req);

    // Tìm cửa hàng của user
    const cuaHang = await cuahang.findOne({
      where: { MaTK: user.MaTK },
    });

    if (!cuaHang) {
      return res.status(404).json({
        success: false,
        message: "Bạn không có cửa hàng",
      });
    }

    const { page = 1, limit = 10, include } = req.query;
    const offset = (page - 1) * limit;

    let includeOptions = [];
    if (include && include.includes("hinhanh")) {
      includeOptions.push({
        model: sanpham_hinhanh,
        include: [
          {
            model: hinhanh,
            attributes: ["MaHA", "URL", "MoTa"],
          },
        ],
      });
    }

    const { count, rows: data } = await sanpham.findAndCountAll({
      where: { MaCH: cuaHang.MaCH },
      include: includeOptions,
      order: [["TenSP", "ASC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      message: "Lấy danh sách sản phẩm của bạn thành công",
      data: {
        store: {
          MaCH: cuaHang.MaCH,
          TenCH: cuaHang.TenCH,
        },
        products: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalItems: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (err) {
    if (err.message.includes("Token")) {
      return res.status(401).json({
        success: false,
        message: err.message,
      });
    }

    console.error("❌ Lỗi lấy sản phẩm của tôi:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 🟢 TÌM KIẾM SẢN PHẨM NÂNG CAO
export const searchSanpham = async (req, res) => {
  try {
    const {
      keyword,
      minPrice,
      maxPrice,
      minRating,
      MaCH,
      page = 1,
      limit = 10,
    } = req.query;

    const offset = (page - 1) * limit;
    let whereCondition = {};

    // Tìm kiếm theo từ khóa
    if (keyword) {
      whereCondition[Op.or] = [
        { TenSP: { [Op.like]: `%${keyword}%` } },
        { MoTa: { [Op.like]: `%${keyword}%` } },
        { NguonGoc: { [Op.like]: `%${keyword}%` } },
      ];
    }

    // Lọc theo giá
    if (minPrice !== undefined || maxPrice !== undefined) {
      whereCondition.GiaBan = {};
      if (minPrice !== undefined)
        whereCondition.GiaBan[Op.gte] = parseFloat(minPrice);
      if (maxPrice !== undefined)
        whereCondition.GiaBan[Op.lte] = parseFloat(maxPrice);
    }

    // Lọc theo điểm đánh giá
    if (minRating !== undefined) {
      whereCondition.DiemDG_SP = { [Op.gte]: parseFloat(minRating) };
    }

    // Lọc theo cửa hàng
    if (MaCH) {
      whereCondition.MaCH = MaCH;
    }

    const { count, rows: data } = await sanpham.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: cuahang,
          attributes: ["MaCH", "TenCH", "DiemDG"],
        },
      ],
      order: [
        ["DiemDG_SP", "DESC"],
        ["TenSP", "ASC"],
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      message: "Tìm kiếm sản phẩm thành công",
      data: {
        products: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalItems: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (err) {
    console.error("❌ Lỗi tìm kiếm sản phẩm:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};
