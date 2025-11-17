// controllers/cuahangController.js
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import { Op } from "sequelize";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

const models = initModels(sequelize);
const {
  cuahang,
  taikhoan,
  hinhanh,
  sanpham,
  hdbanhang,
  vaitro,
  taikhoan_vaitro,
} = models;

// 🟢 Middleware authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  console.log(
    "🔐 Middleware auth - Token:",
    token ? `${token.substring(0, 20)}...` : "NULL"
  );

  if (!token) {
    console.log("❌ Middleware: Không có token");
    return res.status(401).json({
      success: false,
      message: "Token không tồn tại. Vui lòng đăng nhập!",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log("❌ Middleware: Token không hợp lệ", err.message);
      return res.status(403).json({
        success: false,
        message: "Token không hợp lệ hoặc đã hết hạn",
      });
    }

    console.log("✅ Middleware: Token hợp lệ, user:", user);
    req.user = user;
    next();
  });
};

// 🟢 TẠO THƯ MỤC UPLOAD
const ensureUploadDir = (type = "stores") => {
  const uploadDir = path.join(process.cwd(), "public", "uploads", type);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// 🟢 XỬ LÝ UPLOAD FILE
const handleFileUpload = (file, type = "stores") => {
  ensureUploadDir(type);
  const uploadDir = path.join(process.cwd(), "public", "uploads", type);

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

  return `/uploads/${type}/${fileName}`;
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

// 🟢 XÓA FILE VẬT LÝ
const deletePhysicalFile = (filePath) => {
  try {
    const fullPath = path.join(process.cwd(), "public", filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`✅ Đã xóa file: ${filePath}`);
    }
  } catch (error) {
    console.warn(`⚠️ Không thể xóa file: ${filePath}`, error.message);
  }
};

// 🏪 ĐĂNG KÝ THÔNG TIN GIAN HÀNG - CHỈ USER ĐÃ ĐĂNG NHẬP
export const createCuahang = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Chưa đăng nhập",
      });
    }

    console.log(`👤 Authenticated user: ${user.MaTK}`);

    // 🟢 KIỂM TRA USER TỒN TẠI
    const userAccount = await taikhoan.findByPk(user.MaTK, { transaction });
    if (!userAccount) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản",
      });
    }

    const { TenCH, LoaiHinhKD, MaSoThue, DCLayHang, MoTa } = req.body;

    // 🟢 VALIDATION
    if (!TenCH || TenCH.trim() === "") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Tên cửa hàng không được để trống",
      });
    }

    // 🟢 KIỂM TRA USER ĐÃ CÓ CỬA HÀNG CHƯA
    const existingUserCH = await cuahang.findOne({
      where: { MaTK: user.MaTK },
      transaction,
    });

    if (existingUserCH) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Bạn đã có cửa hàng rồi",
        data: {
          existingStore: {
            MaCH: existingUserCH.MaCH,
            TenCH: existingUserCH.TenCH,
          },
        },
      });
    }

    // 🟢 TẠO MÃ GIAN HÀNG TỰ ĐỘNG (Format: CHYYMM0001)
    const now = new Date();
    const storePrefix =
      "CH" +
      now.getFullYear().toString().slice(2) +
      String(now.getMonth() + 1).padStart(2, "0");

    const lastStore = await cuahang.findOne({
      where: { MaCH: { [Op.like]: `${storePrefix}%` } },
      order: [["MaCH", "DESC"]],
      transaction,
    });

    let newStoreId = storePrefix + "0001";
    if (lastStore) {
      const num = parseInt(lastStore.MaCH.slice(6)) + 1;
      newStoreId = storePrefix + num.toString().padStart(4, "0");
    }

    // 🟢 TẠO MÃ HỢP ĐỒNG TỰ ĐỘNG (Format: HDYYMM0001)
    const contractPrefix =
      "HD" +
      now.getFullYear().toString().slice(2) +
      String(now.getMonth() + 1).padStart(2, "0");

    const lastContract = await hdbanhang.findOne({
      where: { MaHD: { [Op.like]: `${contractPrefix}%` } },
      order: [["MaHD", "DESC"]],
      transaction,
    });

    let newContractId = contractPrefix + "0001";
    if (lastContract) {
      const num = parseInt(lastContract.MaHD.slice(6)) + 1;
      newContractId = contractPrefix + num.toString().padStart(4, "0");
    }

    // 🟢 XỬ LÝ HÌNH ẢNH CỬA HÀNG (PHẦN THÊM MỚI)
    let storeImage = null;
    if (req.file) {
      try {
        const MaHA = await generateMaHA();
        const imageUrl = handleFileUpload(req.file, "stores");

        storeImage = await hinhanh.create(
          {
            MaHA,
            URL: imageUrl,
            MoTa: `Hình ảnh cửa hàng ${TenCH}`,
          },
          { transaction }
        );
        console.log("✅ Đã upload hình ảnh cửa hàng:", MaHA);
      } catch (imageError) {
        console.error("❌ Lỗi upload ảnh cửa hàng:", imageError);
        // Vẫn tiếp tục tạo cửa hàng dù upload ảnh lỗi
      }
    }

    // 🟢 TẠO HỢP ĐỒNG BÁN HÀNG
    const newContract = await hdbanhang.create(
      {
        MaHD: newContractId,
        MaTK: user.MaTK,
        NgayLap: new Date(),
        LoaiHinhKD: LoaiHinhKD || "Bán lẻ",
        MaSoThue: MaSoThue || null,
        DCLayHang: DCLayHang || null,
      },
      { transaction }
    );

    // 🟢 TẠO GIAN HÀNG
    const newCuahang = await cuahang.create(
      {
        MaCH: newStoreId,
        TenCH: TenCH.trim(),
        MoTa: MoTa?.trim() || null,
        SLTheoDoi: 0,
        DiemDG: 0,
        MaHA_CuaHang: storeImage ? storeImage.MaHA : null, // Sử dụng ảnh mới upload hoặc null
        MaTK: user.MaTK,
        MaHD: newContractId,
      },
      { transaction }
    );

    // 🟢 CẬP NHẬT VAI TRÒ THÀNH CỬA HÀNG
    const sellerRole = await vaitro.findOne({
      where: { TenVT: "Cửa Hàng" },
      transaction,
    });

    if (sellerRole) {
      // Xóa role khách hàng cũ (nếu có)
      await taikhoan_vaitro.destroy({
        where: { MaTK: user.MaTK },
        transaction,
      });

      // Thêm role cửa hàng
      await taikhoan_vaitro.create(
        {
          MaTK: user.MaTK,
          MaVT: sellerRole.MaVT,
        },
        { transaction }
      );
    }

    await transaction.commit();

    // Lấy lại thông tin cửa hàng sau khi tạo
    const createdStore = await cuahang.findByPk(newStoreId, {
      include: [
        {
          model: taikhoan,
          as: "MaTK_taikhoan",
          attributes: ["MaTK", "TenDangNhap", "Email"],
        },
        {
          model: hinhanh,
          as: "MaHA_CuaHang_hinhanh",
          attributes: ["MaHA", "URL", "MoTa"],
        },
        {
          model: hdbanhang,
          as: "MaHD_hdbanhang",
          attributes: [
            "MaHD",
            "NgayLap",
            "LoaiHinhKD",
            "MaSoThue",
            "DCLayHang",
          ],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Đăng ký gian hàng thành công",
      data: createdStore,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Lỗi đăng ký gian hàng:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 🟢 LẤY DANH SÁCH TẤT CẢ GIAN HÀNG - AI CŨNG XEM ĐƯỢC
export const getAllCuahang = async (req, res) => {
  try {
    const { include } = req.query;

    let options = {
      order: [["TenCH", "ASC"]],
    };

    if (include) {
      const includes = include.split(",");
      options.include = [];

      if (includes.includes("taikhoan")) {
        options.include.push({
          model: taikhoan,
          as: "MaTK_taikhoan",
          attributes: ["MaTK", "TenDangNhap", "Email"],
        });
      }

      if (includes.includes("hinhanh")) {
        options.include.push({
          model: hinhanh,
          as: "MaHA_CuaHang_hinhanh",
          attributes: ["MaHA", "URL", "MoTa"],
        });
      }
    }

    const data = await cuahang.findAll(options);

    res.json({
      success: true,
      message: "Lấy danh sách gian hàng thành công",
      count: data.length,
      data: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách gian hàng",
      error: err.message,
    });
  }
};

// 🟢 LẤY THÔNG TIN GIAN HÀNG THEO MÃ - AI CŨNG XEM ĐƯỢC
export const getCuahangById = async (req, res) => {
  try {
    const { MaCH } = req.params;
    const { include } = req.query;

    let options = {
      where: { MaCH },
    };

    if (include) {
      const includes = include.split(",");
      options.include = [];

      if (includes.includes("taikhoan")) {
        options.include.push({
          model: taikhoan,
          as: "MaTK_taikhoan",
          attributes: ["MaTK", "TenDangNhap", "Email", "LoaiTK"],
        });
      }

      if (includes.includes("hinhanh")) {
        options.include.push({
          model: hinhanh,
          as: "MaHA_CuaHang_hinhanh",
          attributes: ["MaHA", "URL", "MoTa", "NgayTao"],
        });
      }

      if (includes.includes("hdbanhang")) {
        options.include.push({
          model: hdbanhang,
          as: "MaHD_hdbanhang",
          attributes: [
            "MaHD",
            "NgayLap",
            "LoaiHinhKD",
            "MaSoThue",
            "DCLayHang",
          ],
        });
      }
    }

    const item = await cuahang.findOne(options);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy gian hàng",
      });
    }

    res.json({
      success: true,
      message: "Lấy thông tin gian hàng thành công",
      data: item,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin gian hàng",
      error: err.message,
    });
  }
};

// ✏️ CHỈNH SỬA THÔNG TIN GIAN HÀNG - CHỈ CHỦ CỬA HÀNG
export const updateCuahang = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { MaCH } = req.params;

    console.log("🔄 [UPDATE] Nhận request update store:", MaCH);
    console.log("👤 [UPDATE] User:", req.user);
    console.log("📦 [UPDATE] Có file upload:", !!req.file);

    const user = req.user;
    if (!user || !user.MaTK) {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: "Chưa đăng nhập hoặc token không hợp lệ",
      });
    }

    // 🟢 KIỂM TRA USER
    const userInDB = await taikhoan.findByPk(user.MaTK, {
      attributes: ["MaTK", "TenDangNhap", "Email", "TrangThai"],
      transaction,
    });

    if (!userInDB || userInDB.TrangThai !== "Hoạt động") {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: "Tài khoản không tồn tại hoặc đã bị khóa",
      });
    }

    // 🟢 TÌM CỬA HÀNG
    const store = await cuahang.findByPk(MaCH, { transaction });
    if (!store) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cửa hàng",
      });
    }

    // 🟢 KIỂM TRA QUYỀN SỞ HỮU
    if (store.MaTK !== user.MaTK) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền chỉnh sửa cửa hàng này",
      });
    }

    const { TenCH, MoTa, DCLayHang, LoaiHinhKD, MaSoThue } = req.body;

    // 🟢 XỬ LÝ HÌNH ẢNH MỚI (PHẦN THÊM MỚI)
    let newImage = null;
    if (req.file) {
      try {
        const MaHA = await generateMaHA();
        const imageUrl = handleFileUpload(req.file, "stores");

        newImage = await hinhanh.create(
          {
            MaHA,
            URL: imageUrl,
            MoTa: `Hình ảnh cửa hàng ${TenCH || store.TenCH}`,
          },
          { transaction }
        );
        console.log("✅ Đã upload hình ảnh mới:", MaHA);

        // 🟢 XÓA HÌNH ẢNH CŨ NẾU CÓ
        if (store.MaHA_CuaHang) {
          const oldImage = await hinhanh.findByPk(store.MaHA_CuaHang, {
            transaction,
          });
          if (oldImage) {
            await hinhanh.destroy({
              where: { MaHA: store.MaHA_CuaHang },
              transaction,
            });
            deletePhysicalFile(oldImage.URL);
            console.log("✅ Đã xóa hình ảnh cũ:", store.MaHA_CuaHang);
          }
        }
      } catch (imageError) {
        console.error("❌ Lỗi upload ảnh mới:", imageError);
        // Vẫn tiếp tục cập nhật thông tin khác
      }
    }

    // 🟢 CẬP NHẬT THÔNG TIN CỬA HÀNG
    const updateData = {};
    if (TenCH !== undefined) updateData.TenCH = TenCH.trim();
    if (MoTa !== undefined) updateData.MoTa = MoTa?.trim() || null;
    if (DCLayHang !== undefined) updateData.DCLayHang = DCLayHang;
    if (newImage) updateData.MaHA_CuaHang = newImage.MaHA;

    if (Object.keys(updateData).length > 0) {
      await store.update(updateData, { transaction });
    }

    // 🟢 CẬP NHẬT THÔNG TIN HỢP ĐỒNG
    if (LoaiHinhKD !== undefined || MaSoThue !== undefined) {
      const contract = await hdbanhang.findOne({
        where: { MaHD: store.MaHD },
        transaction,
      });

      if (contract) {
        const contractUpdate = {};
        if (LoaiHinhKD !== undefined) contractUpdate.LoaiHinhKD = LoaiHinhKD;
        if (MaSoThue !== undefined) contractUpdate.MaSoThue = MaSoThue;

        if (Object.keys(contractUpdate).length > 0) {
          await contract.update(contractUpdate, { transaction });
        }
      }
    }

    await transaction.commit();

    // 🟢 LẤY LẠI THÔNG TIN CỬA HÀNG SAU KHI UPDATE
    const updatedStore = await cuahang.findByPk(MaCH, {
      include: [
        {
          model: taikhoan,
          as: "MaTK_taikhoan",
          attributes: ["MaTK", "TenDangNhap", "Email"],
        },
        {
          model: hinhanh,
          as: "MaHA_CuaHang_hinhanh",
          attributes: ["MaHA", "URL", "MoTa"],
        },
        {
          model: hdbanhang,
          as: "MaHD_hdbanhang",
          attributes: [
            "MaHD",
            "LoaiHinhKD",
            "MaSoThue",
            "DCLayHang",
            "NgayLap",
          ],
        },
      ],
    });

    console.log("✅ Cập nhật cửa hàng thành công");

    res.json({
      success: true,
      message: "Cập nhật thông tin gian hàng thành công",
      data: updatedStore,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Lỗi cập nhật gian hàng:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 🟢 THÊM HÌNH ẢNH CHO CỬA HÀNG (PHẦN THÊM MỚI)
export const addStoreImage = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { MaCH } = req.params;
    const { MoTa } = req.body;

    const user = req.user;
    if (!user) {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: "Chưa đăng nhập",
      });
    }

    // 🟢 KIỂM TRA CỬA HÀNG VÀ QUYỀN SỞ HỮU
    const store = await cuahang.findByPk(MaCH, { transaction });
    if (!store) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cửa hàng",
      });
    }

    if (store.MaTK !== user.MaTK) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thêm hình ảnh cho cửa hàng này",
      });
    }

    // 🟢 KIỂM TRA FILE UPLOAD
    if (!req.file) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn hình ảnh để upload",
      });
    }

    // 🟢 XÓA HÌNH ẢNH CŨ NẾU CÓ
    if (store.MaHA_CuaHang) {
      const oldImage = await hinhanh.findByPk(store.MaHA_CuaHang, {
        transaction,
      });
      if (oldImage) {
        await hinhanh.destroy({
          where: { MaHA: store.MaHA_CuaHang },
          transaction,
        });
        deletePhysicalFile(oldImage.URL);
      }
    }

    // 🟢 TẠO HÌNH ẢNH MỚI
    const MaHA = await generateMaHA();
    const imageUrl = handleFileUpload(req.file, "stores");

    const newImage = await hinhanh.create(
      {
        MaHA,
        URL: imageUrl,
        MoTa: MoTa || `Hình ảnh cửa hàng ${store.TenCH}`,
      },
      { transaction }
    );

    // 🟢 CẬP NHẬT CỬA HÀNG VỚI HÌNH ẢNH MỚI
    await store.update(
      {
        MaHA_CuaHang: newImage.MaHA,
      },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Thêm hình ảnh cửa hàng thành công",
      data: newImage,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Lỗi thêm hình ảnh cửa hàng:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 🗑️ XÓA GIAN HÀNG - CHỈ CHỦ CỬA HÀNG
export const deleteCuahang = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { MaCH } = req.params;
    const user = req.user;

    if (!user) {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: "Chưa đăng nhập",
      });
    }

    const store = await cuahang.findByPk(MaCH, { transaction });
    if (!store) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cửa hàng",
      });
    }

    // 🟢 KIỂM TRA QUYỀN SỞ HỮU
    if (store.MaTK !== user.MaTK) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa cửa hàng này",
      });
    }

    // 🚨 KIỂM TRA CÓ SẢN PHẨM THUỘC CỬA HÀNG KHÔNG
    const productsCount = await sanpham.count({
      where: { MaCH: MaCH },
      transaction,
    });

    if (productsCount > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Không thể xóa cửa hàng. Còn ${productsCount} sản phẩm thuộc cửa hàng này. Hãy xóa hoặc chuyển sản phẩm trước.`,
      });
    }

    // 🟢 XÓA HÌNH ẢNH CỬA HÀNG NẾU CÓ (PHẦN THÊM MỚI)
    if (store.MaHA_CuaHang) {
      const storeImage = await hinhanh.findByPk(store.MaHA_CuaHang, {
        transaction,
      });
      if (storeImage) {
        await hinhanh.destroy({
          where: { MaHA: store.MaHA_CuaHang },
          transaction,
        });
        deletePhysicalFile(storeImage.URL);
      }
    }

    // 🟢 XÓA HỢP ĐỒNG
    await hdbanhang.destroy({
      where: { MaHD: store.MaHD },
      transaction,
    });

    // 🟢 XÓA CỬA HÀNG
    await store.destroy({ transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: "Xóa gian hàng thành công",
    });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa gian hàng",
      error: err.message,
    });
  }
};

// 📋 LẤY THÔNG TIN CỬA HÀNG CỦA TÔI - CHỦ CỬA HÀNG
export const getMyCuahang = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Chưa đăng nhập",
      });
    }

    const item = await cuahang.findOne({
      where: { MaTK: user.MaTK },
      include: [
        {
          model: taikhoan,
          as: "MaTK_taikhoan",
          attributes: ["MaTK", "TenDangNhap", "Email"],
        },
        {
          model: hinhanh,
          as: "MaHA_CuaHang_hinhanh",
          attributes: ["MaHA", "URL", "MoTa"],
        },
        {
          model: hdbanhang,
          as: "MaHD_hdbanhang",
          attributes: [
            "MaHD",
            "NgayLap",
            "LoaiHinhKD",
            "MaSoThue",
            "DCLayHang",
          ],
        },
      ],
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Bạn chưa có cửa hàng",
      });
    }

    res.json({
      success: true,
      message: "Lấy thông tin cửa hàng thành công",
      data: item,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin cửa hàng",
      error: err.message,
    });
  }
};

// 🔍 TÌM KIẾM GIAN HÀNG THEO TÊN - AI CŨNG XEM ĐƯỢC
export const searchCuahang = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập từ khóa tìm kiếm",
      });
    }

    const data = await cuahang.findAll({
      where: {
        TenCH: {
          [Op.like]: `%${keyword}%`,
        },
      },
      order: [["TenCH", "ASC"]],
    });

    res.json({
      success: true,
      message: "Tìm kiếm gian hàng thành công",
      count: data.length,
      data: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi tìm kiếm gian hàng",
      error: err.message,
    });
  }
};

// 📈 CẬP NHẬT SỐ LƯỢNG THEO DÕI - AI CŨNG ĐƯỢC
export const updateTheoDoi = async (req, res) => {
  try {
    const { MaCH } = req.params;
    const { action } = req.body; // 'tang' hoặc 'giam'

    const item = await cuahang.findByPk(MaCH);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy gian hàng",
      });
    }

    let newSLTheoDoi = item.SLTheoDoi;

    if (action === "tang") {
      newSLTheoDoi += 1;
    } else if (action === "giam" && newSLTheoDoi > 0) {
      newSLTheoDoi -= 1;
    }

    await item.update({ SLTheoDoi: newSLTheoDoi });

    res.json({
      success: true,
      message: "Cập nhật số lượng theo dõi thành công",
      data: item,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật số lượng theo dõi",
      error: err.message,
    });
  }
};

// 📊 THỐNG KÊ CỬA HÀNG (FUNCTION BỊ THIẾU)
export const getStoreStats = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Chưa đăng nhập",
      });
    }

    const store = await cuahang.findOne({
      where: { MaTK: user.MaTK },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Bạn không có cửa hàng",
      });
    }

    // 🟢 THỐNG KÊ SẢN PHẨM
    const totalProducts = await sanpham.count({
      where: { MaCH: store.MaCH },
    });

    const activeProducts = await sanpham.count({
      where: {
        MaCH: store.MaCH,
        TrangThai: "Đang bán",
      },
    });

    const outOfStockProducts = await sanpham.count({
      where: {
        MaCH: store.MaCH,
        SLTon: 0,
      },
    });

    const totalInventoryValue = await sanpham.sum("GiaBan", {
      where: { MaCH: store.MaCH },
    });

    // 🟢 THỐNG KÊ ĐÁNH GIÁ
    const averageRating = store.DiemDG || 0;
    const followerCount = store.SLTheoDoi || 0;

    res.json({
      success: true,
      message: "Lấy thống kê cửa hàng thành công",
      data: {
        storeInfo: {
          MaCH: store.MaCH,
          TenCH: store.TenCH,
          NgayTao: store.createdAt,
        },
        productStats: {
          totalProducts,
          activeProducts,
          outOfStockProducts,
          totalInventoryValue: totalInventoryValue || 0,
        },
        engagementStats: {
          averageRating,
          followerCount,
        },
      },
    });
  } catch (err) {
    console.error("❌ Lỗi lấy thống kê cửa hàng:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 🏆 TOP CỬA HÀNG (FUNCTION BỊ THIẾU)
export const getTopStores = async (req, res) => {
  try {
    const { type = "rating", limit = 10 } = req.query;

    let order = [];
    switch (type) {
      case "rating":
        order = [["DiemDG", "DESC"]];
        break;
      case "followers":
        order = [["SLTheoDoi", "DESC"]];
        break;
      case "newest":
        order = [["createdAt", "DESC"]];
        break;
      default:
        order = [["DiemDG", "DESC"]];
    }

    const topStores = await cuahang.findAll({
      include: [
        {
          model: hinhanh,
          as: "MaHA_CuaHang_hinhanh",
          attributes: ["MaHA", "URL", "MoTa"],
        },
      ],
      order,
      limit: parseInt(limit),
    });

    // 🟢 THÊM SỐ LƯỢNG SẢN PHẨM
    const storesWithProductCount = await Promise.all(
      topStores.map(async (store) => {
        const productCount = await sanpham.count({
          where: { MaCH: store.MaCH },
        });
        return {
          ...store.toJSON(),
          SoLuongSanPham: productCount,
        };
      })
    );

    res.json({
      success: true,
      message: `Lấy top ${limit} cửa hàng thành công`,
      data: {
        type,
        stores: storesWithProductCount,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi lấy top cửa hàng:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 📊 THỐNG KÊ TỒN KHO CỬA HÀNG - PUBLIC/PROTECTED
export const getThongKeTonKho = async (req, res) => {
  try {
    let MaCH;

    if (req.params.MaCH) {
      // 🟢 ROUTE PUBLIC: /api/cuahang/CH001/thong-ke-ton-kho
      MaCH = req.params.MaCH;
    } else {
      // 🟢 ROUTE PROTECTED: /api/cuahang/tao/thong-ke-ton-kho
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Chưa đăng nhập",
        });
      }

      const cuaHang = await cuahang.findOne({
        where: { MaTK: user.MaTK },
      });

      if (!cuaHang) {
        return res.status(404).json({
          success: false,
          message: "Bạn không có cửa hàng",
        });
      }

      MaCH = cuaHang.MaCH;
    }

    // 🟢 KIỂM TRA CỬA HÀNG TỒN TẠI
    const cuaHangInfo = await cuahang.findByPk(MaCH);
    if (!cuaHangInfo) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cửa hàng",
      });
    }

    // 🟢 LẤY TẤT CẢ SẢN PHẨM CỦA CỬA HÀNG
    const products = await sanpham.findAll({
      where: { MaCH: MaCH },
      attributes: ["MaSP", "TenSP", "SLTon", "GiaBan", "TrangThai", "DVT"],
      order: [["SLTon", "DESC"]],
    });

    // 🟢 TÍNH TOÁN THỐNG KÊ
    const tongSoSanPham = products.length;
    const tongSoLuongTon = products.reduce(
      (sum, product) => sum + (product.SLTon || 0),
      0
    );
    const tongGiaTriTonKho = products.reduce((sum, product) => {
      return sum + (product.SLTon || 0) * parseFloat(product.GiaBan || 0);
    }, 0);

    // 🟢 PHÂN LOẠI SẢN PHẨM
    const sanPhamSapHet = products.filter((p) => p.SLTon > 0 && p.SLTon <= 10);
    const sanPhamHetHang = products.filter((p) => p.SLTon === 0);
    const sanPhamConNhieu = products.filter((p) => p.SLTon > 10);

    res.json({
      success: true,
      message: "Thống kê tồn kho thành công",
      data: {
        thongTinCuaHang: {
          MaCH: cuaHangInfo.MaCH,
          TenCH: cuaHangInfo.TenCH,
        },
        tongQuan: {
          tongSoSanPham,
          tongSoLuongTon,
          tongGiaTriTonKho: Math.round(tongGiaTriTonKho),
          trungBinhTonKho:
            tongSoSanPham > 0 ? Math.round(tongSoLuongTon / tongSoSanPham) : 0,
        },
        phanLoaiTonKho: {
          sapHetHang: { soLuong: sanPhamSapHet.length },
          hetHang: { soLuong: sanPhamHetHang.length },
          conNhieu: { soLuong: sanPhamConNhieu.length },
        },
        chiTietSanPham: products,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi thống kê tồn kho:", err.message);
    res.status(500).json({
      success: false,
      message: "Lỗi khi thống kê tồn kho",
      error: err.message,
    });
  }
};

// 📊 THỐNG KÊ TỒN KHO VỚI BỘ LỌC - CHỦ CỬA HÀNG
export const getThongKeTonKhoFilter = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Chưa đăng nhập",
      });
    }

    const { minStock, maxStock, trangThai } = req.query;

    // 🟢 TÌM CỬA HÀNG CỦA USER
    const cuaHang = await cuahang.findOne({
      where: { MaTK: user.MaTK },
    });

    if (!cuaHang) {
      return res.status(404).json({
        success: false,
        message: "Bạn không có cửa hàng",
      });
    }

    // 🟢 XÂY DỰNG ĐIỀU KIỆN FILTER
    let whereCondition = { MaCH: cuaHang.MaCH };

    if (minStock !== undefined || maxStock !== undefined) {
      whereCondition.SLTon = {};
      if (minStock !== undefined)
        whereCondition.SLTon[Op.gte] = parseInt(minStock);
      if (maxStock !== undefined)
        whereCondition.SLTon[Op.lte] = parseInt(maxStock);
    }

    if (trangThai) {
      whereCondition.TrangThai = trangThai;
    }

    const products = await sanpham.findAll({
      where: whereCondition,
      attributes: ["MaSP", "TenSP", "SLTon", "GiaBan", "TrangThai", "DVT"],
      order: [["SLTon", "DESC"]],
    });

    res.json({
      success: true,
      message: "Thống kê tồn kho với bộ lọc thành công",
      data: {
        filters: { minStock, maxStock, trangThai },
        tongSoSanPham: products.length,
        sanPham: products,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi thống kê tồn kho có lọc:", err.message);
    res.status(500).json({
      success: false,
      message: "Lỗi khi thống kê tồn kho",
      error: err.message,
    });
  }
};

// Export cả middleware
export { authenticateToken };
