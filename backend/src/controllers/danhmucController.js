// src/controllers/danhmucController.js
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import { Op } from "sequelize";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const models = initModels(sequelize);
const { danhmuc, sanpham, sanpham_danhmuc, taikhoan } = models;

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
    attributes: ["MaTK", "TenDangNhap", "Email", "TrangThai", "MaVaiTro"],
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
    MaVaiTro: user.MaVaiTro,
  };
};

// 🟢 KIỂM TRA QUYỀN ADMIN
const checkAdminPermission = (user) => {
  if (user.MaVaiTro !== "ADMIN" && user.MaVaiTro !== "QUANTRI") {
    throw new Error("Bạn không có quyền thực hiện thao tác này");
  }
};

// 🟢 TẠO MÃ DANH MỤC
const generateMaDM = async () => {
  const now = new Date();
  const categoryPrefix = "DM" + now.getFullYear().toString().slice(2);

  const lastCategory = await danhmuc.findOne({
    where: { MaDM: { [Op.like]: `${categoryPrefix}%` } },
    order: [["MaDM", "DESC"]],
  });

  let newCategoryId = categoryPrefix + "001";
  if (lastCategory) {
    const lastNum = parseInt(lastCategory.MaDM.slice(4)) || 0;
    newCategoryId = categoryPrefix + String(lastNum + 1).padStart(3, "0");
  }

  return newCategoryId;
};

// 🟢 LẤY TẤT CẢ DANH MỤC
export const getAllDanhMuc = async (req, res) => {
  try {
    const { includeCount, search, page = 1, limit = 50, sortBy = "name" } = req.query;
    
    // Nếu có includeCount, trả về danh mục với số lượng sản phẩm
    if (includeCount === "true") {
      return getCategoriesWithCount(req, res);
    }

    // Xử lý phân trang
    const offset = (page - 1) * limit;
    let whereCondition = {};
    let order = [["TenDM", "ASC"]];

    // Tìm kiếm theo tên danh mục
    if (search && search.trim() !== "") {
      whereCondition.TenDM = { [Op.like]: `%${search.trim()}%` };
    }

    // Sắp xếp
    switch (sortBy) {
      case "name_desc":
        order = [["TenDM", "DESC"]];
        break;
      case "newest":
        order = [["MaDM", "DESC"]];
        break;
      case "oldest":
        order = [["MaDM", "ASC"]];
        break;
      case "name":
      default:
        order = [["TenDM", "ASC"]];
        break;
    }

    const { count, rows: categories } = await danhmuc.findAndCountAll({
      where: whereCondition,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    console.log(`📋 Lấy danh sách ${categories.length} danh mục`);

    res.json({
      success: true,
      message: "Lấy danh sách danh mục thành công",
      data: {
        categories,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalItems: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh mục:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

// 🟢 LẤY DANH MỤC VỚI SỐ LƯỢNG SẢN PHẨM
export const getCategoriesWithCount = async (req, res) => {
  try {
    const { search, minProducts, maxProducts } = req.query;

    let havingCondition = {};
    
    // Điều kiện số lượng sản phẩm
    if (minProducts) {
      havingCondition[Op.gte] = [sequelize.fn("COUNT", sequelize.col("MaSP_sanpham_sanpham_danhmucs.MaSP")), parseInt(minProducts)];
    }
    if (maxProducts) {
      havingCondition[Op.lte] = [sequelize.fn("COUNT", sequelize.col("MaSP_sanpham_sanpham_danhmucs.MaSP")), parseInt(maxProducts)];
    }

    const categories = await danhmuc.findAll({
      include: [
        {
          model: sanpham,
          as: "MaSP_sanpham_sanpham_danhmucs",
          attributes: [],
          through: { attributes: [] },
          required: false, // LEFT JOIN để bao gồm cả danh mục không có sản phẩm
        },
      ],
      attributes: {
        include: [
          [
            sequelize.fn(
              "COUNT",
              sequelize.col("MaSP_sanpham_sanpham_danhmucs.MaSP")
            ),
            "SoLuongSP",
          ],
        ],
      },
      group: ["danhmuc.MaDM"],
      having: Object.keys(havingCondition).length > 0 ? havingCondition : undefined,
      order: [["TenDM", "ASC"]],
    });

    console.log(`📊 Lấy ${categories.length} danh mục với số lượng sản phẩm`);

    res.json({
      success: true,
      message: "Lấy danh mục thành công",
      data: { categories },
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh mục:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

// 🟢 LẤY CHI TIẾT DANH MỤC
export const getDanhMucById = async (req, res) => {
  try {
    const { MaDM } = req.params;
    const { includeProducts } = req.query;

    let includeOptions = [];

    // Nếu có includeProducts, lấy cả sản phẩm thuộc danh mục
    if (includeProducts === "true") {
      includeOptions.push({
        model: sanpham,
        as: "MaSP_sanpham_sanpham_danhmucs",
        attributes: ["MaSP", "TenSP", "GiaBan", "TrangThai", "SLTon", "DiemDG_SP"],
        through: { attributes: [] },
        include: [
          {
            model: models.hinhanh,
            as: "hinhanhs",
            attributes: ["MaHA", "URL"],
            through: { attributes: [] },
            limit: 1,
          },
          {
            model: models.cuahang,
            as: "cuahang",
            attributes: ["MaCH", "TenCH"],
          },
        ],
      });
    }

    const category = await danhmuc.findByPk(MaDM, {
      include: includeOptions,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh mục",
      });
    }

    // Lấy số lượng sản phẩm nếu không include products
    if (includeProducts !== "true") {
      const productCount = await sanpham_danhmuc.count({
        where: { MaDM: MaDM },
      });
      category.setDataValue("SoLuongSP", productCount);
    }

    console.log(`📖 Lấy chi tiết danh mục: ${category.TenDM}`);

    res.json({
      success: true,
      message: "Lấy thông tin danh mục thành công",
      data: category,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy chi tiết danh mục:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

// 🟢 TẠO DANH MỤC MỚI
export const createDanhMuc = async (req, res) => {
  try {
    // Xác thực user
    const user = await authenticateUser(req);
    
    // Kiểm tra quyền admin
    checkAdminPermission(user);

    const { TenDM, MoTa, TrangThai = "Active" } = req.body;

    // Validation
    if (!TenDM || TenDM.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Tên danh mục không được để trống",
      });
    }

    // Kiểm tra danh mục trùng tên
    const existingCategory = await danhmuc.findOne({
      where: { TenDM: TenDM.trim() },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Tên danh mục đã tồn tại",
      });
    }

    // Tạo mã danh mục mới
    const MaDM = await generateMaDM();

    // Tạo danh mục mới
    const newCategory = await danhmuc.create({
      MaDM,
      TenDM: TenDM.trim(),
      MoTa: MoTa?.trim() || null,
      TrangThai,
    });

    console.log(`🆕 Tạo danh mục mới: ${newCategory.TenDM} (${newCategory.MaDM})`);

    res.status(201).json({
      success: true,
      message: "Tạo danh mục mới thành công",
      data: newCategory,
    });
  } catch (error) {
    console.error("❌ Lỗi tạo danh mục:", error);

    if (error.message.includes("Token")) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes("quyền")) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

// 🟢 CẬP NHẬT DANH MỤC
export const updateDanhMuc = async (req, res) => {
  try {
    // Xác thực user
    const user = await authenticateUser(req);
    
    // Kiểm tra quyền admin
    checkAdminPermission(user);

    const { MaDM } = req.params;
    const { TenDM, MoTa, TrangThai } = req.body;

    // Tìm danh mục
    const category = await danhmuc.findByPk(MaDM);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh mục",
      });
    }

    // Validation
    if (TenDM !== undefined && TenDM.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Tên danh mục không được để trống",
      });
    }

    // Kiểm tra danh mục trùng tên (trừ chính nó)
    if (TenDM && TenDM.trim() !== category.TenDM) {
      const existingCategory = await danhmuc.findOne({
        where: { 
          TenDM: TenDM.trim(),
          MaDM: { [Op.ne]: MaDM }
        },
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: "Tên danh mục đã tồn tại",
        });
      }
    }

    // Cập nhật thông tin
    const updateData = {};
    if (TenDM !== undefined) updateData.TenDM = TenDM.trim();
    if (MoTa !== undefined) updateData.MoTa = MoTa?.trim() || null;
    if (TrangThai !== undefined) updateData.TrangThai = TrangThai;

    await category.update(updateData);

    console.log(`✏️ Cập nhật danh mục: ${category.TenDM} (${category.MaDM})`);

    res.json({
      success: true,
      message: "Cập nhật danh mục thành công",
      data: category,
    });
  } catch (error) {
    console.error("❌ Lỗi cập nhật danh mục:", error);

    if (error.message.includes("Token")) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes("quyền")) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

// 🟢 XÓA DANH MỤC
export const deleteDanhMuc = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    // Xác thực user
    const user = await authenticateUser(req);
    
    // Kiểm tra quyền admin
    checkAdminPermission(user);

    const { MaDM } = req.params;

    // Tìm danh mục
    const category = await danhmuc.findByPk(MaDM, { transaction });
    if (!category) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh mục",
      });
    }

    // Kiểm tra xem danh mục có sản phẩm không
    const productCount = await sanpham_danhmuc.count({
      where: { MaDM: MaDM },
      transaction,
    });

    if (productCount > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Không thể xóa danh mục đang có sản phẩm",
        data: {
          productCount,
          suggestion: "Hãy di chuyển hoặc xóa các sản phẩm thuộc danh mục này trước",
        },
      });
    }

    // Xóa danh mục
    await category.destroy({ transaction });
    await transaction.commit();

    console.log(`🗑️ Đã xóa danh mục: ${category.TenDM} (${category.MaDM})`);

    res.json({
      success: true,
      message: "Xóa danh mục thành công",
      data: {
        deletedCategory: {
          MaDM: category.MaDM,
          TenDM: category.TenDM,
        },
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Lỗi xóa danh mục:", error);

    if (error.message.includes("Token")) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes("quyền")) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

// 🟢 TÌM KIẾM DANH MỤC NÂNG CAO
export const searchDanhMuc = async (req, res) => {
  try {
    const { 
      keyword, 
      trangThai, 
      minProducts, 
      maxProducts,
      page = 1, 
      limit = 20,
      sortBy = "name" 
    } = req.query;

    const offset = (page - 1) * limit;
    let whereCondition = {};
    let havingCondition = {};
    let order = [["TenDM", "ASC"]];

    // Tìm kiếm theo từ khóa
    if (keyword) {
      whereCondition[Op.or] = [
        { TenDM: { [Op.like]: `%${keyword}%` } },
        { MoTa: { [Op.like]: `%${keyword}%` } },
      ];
    }

    // Lọc theo trạng thái
    if (trangThai) {
      whereCondition.TrangThai = trangThai;
    }

    // Sắp xếp
    switch (sortBy) {
      case "name_desc":
        order = [["TenDM", "DESC"]];
        break;
      case "products_asc":
        order = [[sequelize.fn("COUNT", sequelize.col("MaSP_sanpham_sanpham_danhmucs.MaSP")), "ASC"]];
        break;
      case "products_desc":
        order = [[sequelize.fn("COUNT", sequelize.col("MaSP_sanpham_sanpham_danhmucs.MaSP")), "DESC"]];
        break;
      case "newest":
        order = [["MaDM", "DESC"]];
        break;
      case "oldest":
        order = [["MaDM", "ASC"]];
        break;
      case "name":
      default:
        order = [["TenDM", "ASC"]];
        break;
    }

    // Điều kiện số lượng sản phẩm
    if (minProducts) {
      havingCondition[Op.gte] = [sequelize.fn("COUNT", sequelize.col("MaSP_sanpham_sanpham_danhmucs.MaSP")), parseInt(minProducts)];
    }
    if (maxProducts) {
      havingCondition[Op.lte] = [sequelize.fn("COUNT", sequelize.col("MaSP_sanpham_sanpham_danhmucs.MaSP")), parseInt(maxProducts)];
    }

    const { count, rows: categories } = await danhmuc.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: sanpham,
          as: "MaSP_sanpham_sanpham_danhmucs",
          attributes: [],
          through: { attributes: [] },
          required: false,
        },
      ],
      attributes: {
        include: [
          [
            sequelize.fn(
              "COUNT",
              sequelize.col("MaSP_sanpham_sanpham_danhmucs.MaSP")
            ),
            "SoLuongSP",
          ],
        ],
      },
      group: ["danhmuc.MaDM"],
      having: Object.keys(havingCondition).length > 0 ? havingCondition : undefined,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    console.log(`🔍 Tìm thấy ${categories.length} danh mục`);

    res.json({
      success: true,
      message: "Tìm kiếm danh mục thành công",
      data: {
        categories,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalItems: count.length || count,
          totalPages: Math.ceil((count.length || count) / limit),
        },
      },
    });
  } catch (error) {
    console.error("❌ Lỗi tìm kiếm danh mục:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

// 🟢 LẤY DANH MỤC PHỔ BIẾN
export const getPopularCategories = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const categories = await danhmuc.findAll({
      include: [
        {
          model: sanpham,
          as: "MaSP_sanpham_sanpham_danhmucs",
          attributes: [],
          through: { attributes: [] },
        },
      ],
      attributes: {
        include: [
          [
            sequelize.fn(
              "COUNT",
              sequelize.col("MaSP_sanpham_sanpham_danhmucs.MaSP")
            ),
            "SoLuongSP",
          ],
        ],
      },
      group: ["danhmuc.MaDM"],
      order: [[sequelize.fn("COUNT", sequelize.col("MaSP_sanpham_sanpham_danhmucs.MaSP")), "DESC"]],
      limit: parseInt(limit),
    });

    console.log(`🏆 Lấy ${categories.length} danh mục phổ biến`);

    res.json({
      success: true,
      message: "Lấy danh mục phổ biến thành công",
      data: { categories },
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh mục phổ biến:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};