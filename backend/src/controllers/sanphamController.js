//import initModels from "../models/init-models.js";
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";

const models = initModels(sequelize);
const { sanpham, cuahang } = models;

// 🟢 Lấy tất cả sản phẩm - BỎ INCLUDE
export const getAllSanpham = async (req, res) => {
  try {
    console.log("🔍 Fetching all products...");
    const data = await sanpham.findAll(); // ← THỰC SỰ BỎ INCLUDE
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
    const item = await sanpham.findByPk(req.params.MaSP); // ← BỎ INCLUDE
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
      where: { MaCH }, // ← BỎ INCLUDE
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Thêm sản phẩm - DEBUG CHI TIẾT LỖI VALIDATION
export const createSanpham = async (req, res) => {
  try {
    console.log("📦 Creating product with data:", req.body);

    // Thử validate trước để xem lỗi cụ thể
    const product = sanpham.build(req.body);
    await product.validate(); // Validate trước khi create

    const newSP = await sanpham.create(req.body);
    console.log("✅ Product created successfully:", newSP.MaSP);
    res.status(201).json(newSP);
  } catch (err) {
    console.error("❌ Error creating product:");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);

    // Hiển thị chi tiết lỗi validation
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

    res.status(500).json({ message: err.message });
  }
};

// 🟢 Cập nhật sản phẩm
export const updateSanpham = async (req, res) => {
  try {
    const { MaSP } = req.params;
    const item = await sanpham.findByPk(MaSP);
    if (!item)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    await item.update(req.body);
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Xóa sản phẩm - CHỈ CHỦ CỬA HÀNG ĐƯỢC XÓA + XÓA DANH MỤC LIÊN QUAN
// 🟢 Xóa sản phẩm - CHỈ CỬA HÀNG ĐƯỢC XÓA SẢN PHẨM CỦA CHÍNH HỌ
export const deleteSanpham = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { MaSP } = req.params;
    const user = req.user;

    console.log(
      `🔍 [DEBUG] User ${user.MaTK} attempting to delete product ${MaSP}`
    );

    if (!user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    // Tìm sản phẩm
    const item = await sanpham.findByPk(MaSP);
    if (!item) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    console.log(`📦 [DEBUG] Product ${MaSP} belongs to store: ${item.MaCH}`);

    // 🚨 KHÔNG CHO XÓA SẢN PHẨM KHÔNG CÓ CỬA HÀNG
    if (item.MaCH === null) {
      console.log(
        `❌ [DEBUG] Product ${MaSP} has no store, deletion not allowed`
      );
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
      console.log(`❌ [DEBUG] User ${user.MaTK} doesn't have a store`);
      return res.status(404).json({ message: "Bạn không có cửa hàng" });
    }

    console.log(`🏪 [DEBUG] User ${user.MaTK} owns store: ${cuaHang.MaCH}`);

    // 🚨 KIỂM TRA QUYỀN SỞ HỮU: Sản phẩm phải thuộc cửa hàng của user
    if (item.MaCH !== cuaHang.MaCH) {
      console.log(
        `❌ [DEBUG] Permission denied: Product store (${item.MaCH}) ≠ User store (${cuaHang.MaCH})`
      );
      return res.status(403).json({
        message:
          "Bạn không có quyền xóa sản phẩm này. Sản phẩm không thuộc cửa hàng của bạn.",
      });
    }

    console.log(
      `✅ [DEBUG] Permission granted, deleting product ${MaSP} from store ${cuaHang.MaCH}`
    );

    // 🗑️ XÓA TẤT CẢ DỮ LIỆU LIÊN QUAN TRƯỚC
    const { sanpham_danhmuc, sanpham_hinhanh } = models;

    // 1. Xóa danh mục liên quan
    const deletedCategories = await sanpham_danhmuc.destroy({
      where: { MaSP: MaSP },
      transaction,
    });
    console.log(
      `🗑️ [DEBUG] Deleted ${deletedCategories} category associations`
    );

    // 2. Xóa hình ảnh liên quan
    const deletedImages = await sanpham_hinhanh.destroy({
      where: { MaSP: MaSP },
      transaction,
    });
    console.log(`🗑️ [DEBUG] Deleted ${deletedImages} image associations`);

    // 🗑️ CUỐI CÙNG: XÓA SẢN PHẨM
    await item.destroy({ transaction });
    await transaction.commit();

    console.log(`✅ [DEBUG] Successfully deleted product ${MaSP}`);

    res.json({
      message: "Đã xóa sản phẩm thành công",
      deletedProduct: MaSP,
      store: cuaHang.MaCH,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Error deleting product:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Lấy sản phẩm của cửa hàng tôi - BỎ INCLUDE
export const getMySanpham = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    // Tìm cửa hàng của user
    const cuaHang = await cuahang.findOne({
      where: { MaTK: user.MaTK },
    });

    if (!cuaHang) {
      return res.status(404).json({ message: "Bạn không có cửa hàng" });
    }

    const data = await sanpham.findAll({
      where: { MaCH: cuaHang.MaCH }, // ← BỎ INCLUDE
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
