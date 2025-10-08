// controllers/sanphamcontroller.js
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import jwt from "jsonwebtoken"; // 🟢 THÊM DÒNG NÀY
import dotenv from "dotenv"; // 🟢 THÊM DÒNG NÀY

dotenv.config(); // 🟢 THÊM DÒNG NÀY

const models = initModels(sequelize);
const { sanpham, cuahang, taikhoan } = models;

// 🟢 HÀM XÁC THỰC JWT (dùng chung cho các function)
const authenticateUser = async (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Token không tồn tại. Vui lòng đăng nhập!");
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

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

// 🟢 Lấy tất cả sản phẩm - BỎ INCLUDE
export const getAllSanpham = async (req, res) => {
  try {
    console.log("🔍 Fetching all products...");
    const data = await sanpham.findAll();
    console.log(`✅ Found ${data.length} products`);
    res.json(data);
  } catch (err) {
    console.error("❌ Error fetching products:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Lấy sản phẩm theo mã - BỎ INCLUDE
export const getSanphamById = async (req, res) => {
  try {
    const item = await sanpham.findByPk(req.params.MaSP);
    if (!item)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Lấy sản phẩm theo cửa hàng - BỎ INCLUDE
export const getSanphamByCuaHang = async (req, res) => {
  try {
    const { MaCH } = req.params;
    const data = await sanpham.findAll({
      where: { MaCH },
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Thêm sản phẩm - CẦN JWT
export const createSanpham = async (req, res) => {
  try {
    console.log("📦 Creating product with data:", req.body);

    // 🟢 XÁC THỰC USER
    const user = await authenticateUser(req);
    console.log(`👤 Authenticated user: ${user.MaTK}`);

    // Tìm cửa hàng của user
    const cuaHang = await cuahang.findOne({
      where: { MaTK: user.MaTK },
    });

    if (!cuaHang) {
      return res.status(404).json({ message: "Bạn không có cửa hàng" });
    }

    // Thêm MaCH vào dữ liệu sản phẩm
    const productData = {
      ...req.body,
      MaCH: cuaHang.MaCH, // 🟢 TỰ ĐỘNG GÁN CỬA HÀNG
    };

    // Validate và tạo sản phẩm
    const product = sanpham.build(productData);
    await product.validate();

    const newSP = await sanpham.create(productData);
    console.log("✅ Product created successfully:", newSP.MaSP);
    res.status(201).json(newSP);
  } catch (err) {
    console.error("❌ Error creating product:");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);

    if (err.name === "SequelizeValidationError") {
      const validationErrors = err.errors.map((error) => ({
        field: error.path,
        message: error.message,
        value: error.value,
      }));
      console.error("Validation errors:", validationErrors);
      return res.status(400).json({
        message: "Lỗi validation",
        errors: validationErrors,
      });
    }

    if (err.message.includes("Token")) {
      return res.status(401).json({ message: err.message });
    }

    res.status(500).json({ message: err.message });
  }
};

// 🟢 Cập nhật sản phẩm - CẦN JWT
export const updateSanpham = async (req, res) => {
  try {
    const { MaSP } = req.params;

    // 🟢 XÁC THỰC USER
    const user = await authenticateUser(req);

    // Tìm sản phẩm
    const item = await sanpham.findByPk(MaSP);
    if (!item)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    // Tìm cửa hàng của user
    const cuaHang = await cuahang.findOne({
      where: { MaTK: user.MaTK },
    });

    if (!cuaHang) {
      return res.status(404).json({ message: "Bạn không có cửa hàng" });
    }

    // 🚨 KIỂM TRA QUYỀN SỞ HỮU
    if (item.MaCH !== cuaHang.MaCH) {
      return res.status(403).json({
        message: "Bạn không có quyền cập nhật sản phẩm này",
      });
    }

    await item.update(req.body);
    res.json(item);
  } catch (err) {
    if (err.message.includes("Token")) {
      return res.status(401).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Xóa sản phẩm - CẦN JWT
export const deleteSanpham = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { MaSP } = req.params;

    // 🟢 XÁC THỰC USER
    const user = await authenticateUser(req);
    console.log(
      `👤 Authenticated user: ${user.MaTK} attempting to delete product ${MaSP}`
    );

    // Tìm sản phẩm
    const item = await sanpham.findByPk(MaSP);
    if (!item) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    console.log(`📦 Product ${MaSP} belongs to store: ${item.MaCH}`);

    // 🚨 KHÔNG CHO XÓA SẢN PHẨM KHÔNG CÓ CỬA HÀNG
    if (item.MaCH === null) {
      console.log(`❌ Product ${MaSP} has no store, deletion not allowed`);
      return res.status(403).json({
        message:
          "Không thể xóa sản phẩm hệ thống. Sản phẩm không thuộc cửa hàng nào.",
      });
    }

    // Tìm cửa hàng của user
    const cuaHang = await cuahang.findOne({
      where: { MaTK: user.MaTK },
    });

    if (!cuaHang) {
      console.log(`❌ User ${user.MaTK} doesn't have a store`);
      return res.status(404).json({ message: "Bạn không có cửa hàng" });
    }

    console.log(`🏪 User ${user.MaTK} owns store: ${cuaHang.MaCH}`);

    // 🚨 KIỂM TRA QUYỀN SỞ HỮU
    if (item.MaCH !== cuaHang.MaCH) {
      console.log(
        `❌ Permission denied: Product store (${item.MaCH}) ≠ User store (${cuaHang.MaCH})`
      );
      return res.status(403).json({
        message:
          "Bạn không có quyền xóa sản phẩm này. Sản phẩm không thuộc cửa hàng của bạn.",
      });
    }

    console.log(
      `✅ Permission granted, deleting product ${MaSP} from store ${cuaHang.MaCH}`
    );

    // Xóa dữ liệu liên quan (nếu có models này)
    const { sanpham_danhmuc, sanpham_hinhanh } = models;

    if (sanpham_danhmuc) {
      const deletedCategories = await sanpham_danhmuc.destroy({
        where: { MaSP: MaSP },
        transaction,
      });
      console.log(`🗑️ Deleted ${deletedCategories} category associations`);
    }

    if (sanpham_hinhanh) {
      const deletedImages = await sanpham_hinhanh.destroy({
        where: { MaSP: MaSP },
        transaction,
      });
      console.log(`🗑️ Deleted ${deletedImages} image associations`);
    }

    // Xóa sản phẩm
    await item.destroy({ transaction });
    await transaction.commit();

    console.log(`✅ Successfully deleted product ${MaSP}`);
    res.json({
      message: "Đã xóa sản phẩm thành công",
      deletedProduct: MaSP,
      store: cuaHang.MaCH,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Error deleting product:", err.message);

    if (err.message.includes("Token")) {
      return res.status(401).json({ message: err.message });
    }

    res.status(500).json({ message: err.message });
  }
};

// 🟢 Lấy sản phẩm của cửa hàng tôi - CẦN JWT
export const getMySanpham = async (req, res) => {
  try {
    // 🟢 XÁC THỰC USER
    const user = await authenticateUser(req);

    // Tìm cửa hàng của user
    const cuaHang = await cuahang.findOne({
      where: { MaTK: user.MaTK },
    });

    if (!cuaHang) {
      return res.status(404).json({ message: "Bạn không có cửa hàng" });
    }

    const data = await sanpham.findAll({
      where: { MaCH: cuaHang.MaCH },
    });

    res.json(data);
  } catch (err) {
    if (err.message.includes("Token")) {
      return res.status(401).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};
