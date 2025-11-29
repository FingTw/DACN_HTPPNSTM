// src/controllers/hinhanhController.js
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

const models = initModels(sequelize);
const { hinhanh, sanpham, cuahang, sanpham_hinhanh, taikhoan } = models;

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

// 🟢 TẠO THƯ MỤC UPLOAD
const ensureUploadDir = (type = "products") => {
  const rootDir = process.cwd();
  const uploadDir = path.join(rootDir, "public", "public", type);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// 🟢 XỬ LÝ UPLOAD FILE
const handleFileUpload = (file, type = "products") => {
  ensureUploadDir(type);
  const uploadDir = path.join(process.cwd(), "public", "public", type);

  const fileExt = path.extname(file.originalname);
  const fileName = `${type}_${Date.now()}_${Math.random()
    .toString(36)
    .substring(7)}${fileExt}`;
  const filePath = path.join(uploadDir, fileName);

  if (!file.buffer) {
    const sourcePath = file.path;
    if (sourcePath && fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, filePath);
    } else {
      throw new Error("File data không hợp lệ");
    }
  } else {
    fs.writeFileSync(filePath, file.buffer);
  }

  return `/public/${type}/${fileName}`;
};

// 🟢 TẠO MÃ HÌNH ẢNH
const generateMaHA = async () => {
  const now = new Date();
  const imagePrefix =
    "HA" +
    now.getFullYear().toString().slice(2) +
    String(now.getMonth() + 1).padStart(2, "0");

  const lastImage = await hinhanh.findOne({
    where: { MaHA: { [Op.like]: `${imagePrefix}%` } },
    order: [["MaHA", "DESC"]],
  });

  let newImageId = imagePrefix + "0001";
  if (lastImage) {
    const lastNum = parseInt(lastImage.MaHA.slice(6)) || 0;
    newImageId = imagePrefix + String(lastNum + 1).padStart(4, "0");
  }

  return newImageId;
};

// 🟢 THÊM HÌNH ẢNH CHO SẢN PHẨM
export const addImageToProduct = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { MaSP } = req.params;
    const { MoTa } = req.body;

    // 🟢 XÁC THỰC USER
    const user = await authenticateUser(req);

    // Kiểm tra sản phẩm tồn tại và quyền sở hữu
    const product = await sanpham.findByPk(MaSP, {
      include: [
        {
          model: cuahang,
          as: "cuahang",
          attributes: ["MaCH", "MaTK"],
        },
      ],
      transaction,
    });

    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    // Kiểm tra quyền sở hữu
    if (product.cuahang.MaTK !== user.MaTK) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thêm hình ảnh cho sản phẩm này",
      });
    }

    // Kiểm tra file upload
    if (!req.file) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn hình ảnh để upload",
      });
    }

    // Tạo mã hình ảnh
    const MaHA = await generateMaHA();

    // Upload file
    const imageUrl = handleFileUpload(req.file, "products");

    // Tạo bản ghi hình ảnh
    const newImage = await hinhanh.create(
      {
        MaHA,
        URL: imageUrl,
        MoTa: MoTa || `Hình ảnh của sản phẩm ${product.TenSP}`,
      },
      { transaction }
    );

    // Liên kết hình ảnh với sản phẩm
    await sanpham_hinhanh.create(
      {
        MaSP: product.MaSP,
        MaHA: newImage.MaHA,
      },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Thêm hình ảnh cho sản phẩm thành công",
      data: newImage,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Lỗi thêm hình ảnh cho sản phẩm:", err);

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

// 🟢 THÊM HÌNH ẢNH CHO CỬA HÀNG
export const addImageToStore = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { MoTa } = req.body;

    // 🟢 XÁC THỰC USER
    const user = await authenticateUser(req);

    // Tìm cửa hàng của user
    const store = await cuahang.findOne({
      where: { MaTK: user.MaTK },
      transaction,
    });

    if (!store) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Bạn không có cửa hàng",
      });
    }

    // Kiểm tra file upload
    if (!req.file) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn hình ảnh để upload",
      });
    }

    // Tạo mã hình ảnh
    const MaHA = await generateMaHA();

    // Upload file
    const imageUrl = handleFileUpload(req.file, "stores");

    // Tạo bản ghi hình ảnh
    const newImage = await hinhanh.create(
      {
        MaHA,
        URL: imageUrl,
        MoTa: MoTa || `Hình ảnh của cửa hàng ${store.TenCH}`,
      },
      { transaction }
    );

    // Cập nhật hình ảnh cho cửa hàng
    await store.update(
      {
        MaHA_CuaHang: newImage.MaHA,
      },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Thêm hình ảnh cho cửa hàng thành công",
      data: newImage,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Lỗi thêm hình ảnh cho cửa hàng:", err);

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

// 🟢 XÓA HÌNH ẢNH
export const deleteImage = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { MaHA } = req.params;

    // 🟢 XÁC THỰC USER
    const user = await authenticateUser(req);

    // Tìm hình ảnh
    const image = await hinhanh.findByPk(MaHA, { transaction });
    if (!image) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hình ảnh",
      });
    }

    // Kiểm tra quyền sở hữu thông qua sản phẩm hoặc cửa hàng
    const productImage = await sanpham_hinhanh.findOne({
      where: { MaHA },
      include: [
        {
          model: sanpham,
          as: "MaSP_sanpham",
          include: [
            {
              model: cuahang,
              as: "cuahang",
              attributes: ["MaTK"],
            },
          ],
        },
      ],
      transaction,
    });

    const storeWithImage = await cuahang.findOne({
      where: { MaHA_CuaHang: MaHA },
      transaction,
    });

    let hasPermission = false;

    if (productImage && productImage.MaSP_sanpham.cuahang.MaTK === user.MaTK) {
      hasPermission = true;
    }

    if (storeWithImage && storeWithImage.MaTK === user.MaTK) {
      hasPermission = true;
    }

    if (!hasPermission) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa hình ảnh này",
      });
    }

    // Xóa liên kết với sản phẩm
    await sanpham_hinhanh.destroy({
      where: { MaHA },
      transaction,
    });

    // Cập nhật cửa hàng nếu đang sử dụng hình ảnh này
    if (storeWithImage) {
      await storeWithImage.update(
        {
          MaHA_CuaHang: null,
        },
        { transaction }
      );
    }

    // Xóa file vật lý
    try {
      const filePath = path.join(process.cwd(), "public", image.URL);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.warn("⚠️ Không thể xóa file vật lý:", fileError.message);
    }

    // Xóa bản ghi hình ảnh
    await image.destroy({ transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: "Xóa hình ảnh thành công",
      data: {
        deletedImage: MaHA,
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

    console.error("❌ Lỗi xóa hình ảnh:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 🟢 LẤY DANH SÁCH HÌNH ẢNH THEO SẢN PHẨM
export const getImagesByProduct = async (req, res) => {
  try {
    const { MaSP } = req.params;

    const product = await sanpham.findByPk(MaSP, {
      include: [
        {
          model: hinhanh,
          as: "hinhanhs",
          attributes: ["MaHA", "URL", "MoTa"],
          through: { attributes: [] },
        },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    res.json({
      success: true,
      message: "Lấy danh sách hình ảnh thành công",
      data: {
        product: {
          MaSP: product.MaSP,
          TenSP: product.TenSP,
        },
        images: product.hinhanhs,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách hình ảnh:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 🟢 LẤY HÌNH ẢNH THEO CỬA HÀNG
export const getStoreImage = async (req, res) => {
  try {
    const { MaCH } = req.params;

    const store = await cuahang.findByPk(MaCH, {
      include: [
        {
          model: hinhanh,
          as: "MaHA_CuaHang_hinhanh",
          attributes: ["MaHA", "URL", "MoTa"],
        },
      ],
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cửa hàng",
      });
    }

    res.json({
      success: true,
      message: "Lấy hình ảnh cửa hàng thành công",
      data: {
        store: {
          MaCH: store.MaCH,
          TenCH: store.TenCH,
        },
        image: store.MaHA_CuaHang_hinhanh,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi lấy hình ảnh cửa hàng:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 🟢 CẬP NHẬT MÔ TẢ HÌNH ẢNH
export const updateImageDescription = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { MaHA } = req.params;
    const { MoTa } = req.body;

    // 🟢 XÁC THỰC USER
    const user = await authenticateUser(req);

    // Tìm hình ảnh
    const image = await hinhanh.findByPk(MaHA, { transaction });
    if (!image) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hình ảnh",
      });
    }

    // Kiểm tra quyền sở hữu (tương tự như hàm delete)
    const productImage = await sanpham_hinhanh.findOne({
      where: { MaHA },
      include: [
        {
          model: sanpham,
          as: "MaSP_sanpham",
          include: [
            {
              model: cuahang,
              as: "cuahang",
              attributes: ["MaTK"],
            },
          ],
        },
      ],
      transaction,
    });

    const storeWithImage = await cuahang.findOne({
      where: { MaHA_CuaHang: MaHA },
      transaction,
    });

    let hasPermission = false;

    if (productImage && productImage.MaSP_sanpham.cuahang.MaTK === user.MaTK) {
      hasPermission = true;
    }

    if (storeWithImage && storeWithImage.MaTK === user.MaTK) {
      hasPermission = true;
    }

    if (!hasPermission) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật hình ảnh này",
      });
    }

    // Cập nhật mô tả
    await image.update(
      {
        MoTa: MoTa || image.MoTa,
      },
      { transaction }
    );

    await transaction.commit();

    res.json({
      success: true,
      message: "Cập nhật mô tả hình ảnh thành công",
      data: image,
    });
  } catch (err) {
    await transaction.rollback();

    if (err.message.includes("Token")) {
      return res.status(401).json({
        success: false,
        message: err.message,
      });
    }

    console.error("❌ Lỗi cập nhật mô tả hình ảnh:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};
