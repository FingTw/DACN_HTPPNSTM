// controllers/cuahangController.js
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import { Op } from "sequelize";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
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
  const token = authHeader && authHeader.split(" ")[1]; // Lấy token sau "Bearer "

  console.log("🔐 Middleware auth - Header:", authHeader);
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

    const { TenCH, MaHA_CuaHang, LoaiHinhKD, MaSoThue, DCLayHang, MoTa } =
      req.body;

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

    // 🟢 KIỂM TRA HÌNH ẢNH TỒN TẠI (nếu có)
    if (MaHA_CuaHang) {
      const existingHA = await hinhanh.findByPk(MaHA_CuaHang, { transaction });
      if (!existingHA) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Hình ảnh không tồn tại",
        });
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
        TenCH,
        MoTa: MoTa || null,
        SLTheoDoi: 0,
        DiemDG: 0,
        MaHA_CuaHang: MaHA_CuaHang || null,
        MaTK: user.MaTK,
        MaHD: newContractId, // Liên kết với hợp đồng
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
          as: "MaTK_taikhoan", // ✅ SỬA: Thêm alias
          attributes: ["MaTK", "TenDangNhap", "Email"],
        },
        {
          model: hinhanh,
          as: "MaHA_CuaHang_hinhanh",
          attributes: ["MaHA", "URL", "MoTa"],
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
          as: "MaTK_taikhoan", // ✅ SỬA: Thêm alias
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
          as: "MaTK_taikhoan", // ✅ SỬA: Thêm alias
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
          as: "MaHD_hdbanhang", // ✅ SỬA: Thêm alias
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

// ✏️ CHỈNH SỬA THÔNG TIN GIAN HÀNG - CHỈ CHỦ CỬA HÀNG - ĐÃ SỬA
// ✏️ CHỈNH SỬA THÔNG TIN GIAN HÀNG - XỬ LÝ CẢ 2 TRƯỜNG HỢP
export const updateCuahang = async (req, res) => {
  try {
    const { MaCH } = req.params;

    console.log("🔄 [UPDATE] Nhận request update store:", MaCH);
    console.log("👤 [UPDATE] User từ request:", req.user);
    console.log("🔐 [UPDATE] Authorization header:", req.headers.authorization);
    console.log("📦 [UPDATE] Dữ liệu nhận:", req.body);

    // 🟢 XỬ LÝ AUTHENTICATION - CẢ 2 TRƯỜNG HỢP
    let user;

    // Cách 1: Lấy user từ middleware (nếu route được bảo vệ)
    if (req.user) {
      user = req.user;
      console.log("✅ [UPDATE] User từ middleware:", {
        MaTK: user.MaTK,
        TenDangNhap: user.TenDangNhap,
      });
    }
    // Cách 2: Tự decode token từ header (nếu route không có middleware)
    else {
      console.log(
        "⚠️ [UPDATE] Không có user từ middleware, tự decode token..."
      );

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("❌ [UPDATE] Không có token trong header");
        return res.status(401).json({
          success: false,
          message: "Token không tồn tại. Vui lòng đăng nhập!",
        });
      }

      const token = authHeader.split(" ")[1];
      console.log(
        "🔐 [UPDATE] Token nhận được:",
        token.substring(0, 20) + "..."
      );

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = decoded;
        console.log("✅ [UPDATE] User từ token decode:", {
          MaTK: user.MaTK,
          TenDangNhap: user.TenDangNhap,
          role: user.role,
        });
      } catch (err) {
        console.log("❌ [UPDATE] Token không hợp lệ:", err.message);
        return res.status(401).json({
          success: false,
          message: "Token không hợp lệ hoặc đã hết hạn",
        });
      }
    }

    if (!user || !user.MaTK) {
      console.log("❌ [UPDATE] Không thể xác thực user");
      return res.status(401).json({
        success: false,
        message: "Chưa đăng nhập hoặc token không hợp lệ",
      });
    }

    // 🟢 KIỂM TRA USER CÓ TỒN TẠI TRONG DATABASE KHÔNG
    const userInDB = await taikhoan.findByPk(user.MaTK, {
      attributes: ["MaTK", "TenDangNhap", "Email", "TrangThai"],
    });

    if (!userInDB) {
      console.log("❌ [UPDATE] User không tồn tại trong database:", user.MaTK);
      return res.status(401).json({
        success: false,
        message: "Tài khoản không tồn tại",
      });
    }

    if (userInDB.TrangThai !== "Hoạt động") {
      console.log("❌ [UPDATE] Tài khoản bị khóa:", user.MaTK);
      return res.status(401).json({
        success: false,
        message: "Tài khoản đã bị khóa",
      });
    }

    console.log("✅ [UPDATE] User đã xác thực thành công:", {
      MaTK: userInDB.MaTK,
      TenDangNhap: userInDB.TenDangNhap,
      TrangThai: userInDB.TrangThai,
    });

    // 🟢 LẤY DỮ LIỆU TỪ REQUEST BODY
    const {
      TenCH,
      MoTa,
      DCLayHang,
      SLTheoDoi,
      DiemDG,
      MaHA_CuaHang,
      LoaiHinhKD,
      MaSoThue,
    } = req.body;

    console.log("📝 [UPDATE] Dữ liệu từ form:", {
      TenCH,
      MoTa: MoTa ? MoTa.substring(0, 50) + "..." : "null",
      DCLayHang,
      LoaiHinhKD,
      MaSoThue,
      MaHA_CuaHang,
    });

    // 🟢 TÌM CỬA HÀNG
    const item = await cuahang.findByPk(MaCH);
    if (!item) {
      console.log("❌ [UPDATE] Không tìm thấy cửa hàng:", MaCH);
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy gian hàng",
      });
    }

    console.log("🏪 [UPDATE] Thông tin cửa hàng hiện tại:", {
      MaCH: item.MaCH,
      TenCH: item.TenCH,
      MaTK: item.MaTK,
      MaHD: item.MaHD,
    });

    // 🟢 KIỂM TRA QUYỀN SỞ HỮU
    if (item.MaTK !== user.MaTK) {
      console.log("❌ [UPDATE] Không có quyền sở hữu:", {
        storeOwner: item.MaTK,
        currentUser: user.MaTK,
      });
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền chỉnh sửa cửa hàng này",
      });
    }

    console.log("✅ [UPDATE] Kiểm tra quyền sở hữu thành công");

    // 🟢 KIỂM TRA HÌNH ẢNH TỒN TẠI (nếu có)
    if (MaHA_CuaHang) {
      const existingHA = await hinhanh.findByPk(MaHA_CuaHang);
      if (!existingHA) {
        console.log("❌ [UPDATE] Hình ảnh không tồn tại:", MaHA_CuaHang);
        return res.status(400).json({
          success: false,
          message: "Hình ảnh không tồn tại",
        });
      }
      console.log("✅ [UPDATE] Hình ảnh tồn tại:", MaHA_CuaHang);
    }

    // 🟢 CẬP NHẬT THÔNG TIN CỬA HÀNG
    const updateData = {
      TenCH: TenCH !== undefined ? TenCH : item.TenCH,
      MoTa: MoTa !== undefined ? MoTa : item.MoTa,
      DCLayHang: DCLayHang !== undefined ? DCLayHang : item.DCLayHang,
      SLTheoDoi: SLTheoDoi !== undefined ? SLTheoDoi : item.SLTheoDoi,
      DiemDG: DiemDG !== undefined ? DiemDG : item.DiemDG,
      MaHA_CuaHang:
        MaHA_CuaHang !== undefined ? MaHA_CuaHang : item.MaHA_CuaHang,
    };

    // Loại bỏ các trường undefined
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    console.log("📝 [UPDATE] Dữ liệu cập nhật cửa hàng:", updateData);

    // Thực hiện update
    await item.update(updateData);
    console.log("✅ [UPDATE] Cập nhật cửa hàng thành công");

    // 🟢 CẬP NHẬT THÔNG TIN HỢP ĐỒNG NẾU CÓ
    if (LoaiHinhKD !== undefined || MaSoThue !== undefined) {
      try {
        const hdbanhangItem = await hdbanhang.findOne({
          where: { MaHD: item.MaHD },
        });

        if (hdbanhangItem) {
          const hdUpdateData = {};
          if (LoaiHinhKD !== undefined) hdUpdateData.LoaiHinhKD = LoaiHinhKD;
          if (MaSoThue !== undefined) hdUpdateData.MaSoThue = MaSoThue;

          // Loại bỏ các trường undefined
          Object.keys(hdUpdateData).forEach((key) => {
            if (hdUpdateData[key] === undefined) {
              delete hdUpdateData[key];
            }
          });

          if (Object.keys(hdUpdateData).length > 0) {
            console.log("📝 [UPDATE] Dữ liệu cập nhật hợp đồng:", hdUpdateData);
            await hdbanhangItem.update(hdUpdateData);
            console.log("✅ [UPDATE] Cập nhật hợp đồng thành công");
          }
        } else {
          console.log("⚠️ [UPDATE] Không tìm thấy hợp đồng:", item.MaHD);
        }
      } catch (hdError) {
        console.warn(
          "⚠️ [UPDATE] Không thể cập nhật hợp đồng:",
          hdError.message
        );
        // Không throw error vì đây không phải lỗi nghiêm trọng
      }
    }

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

    console.log("✅ [UPDATE] Cập nhật hoàn tất");

    res.json({
      success: true,
      message: "Cập nhật thông tin gian hàng thành công",
      data: updatedStore,
    });
  } catch (err) {
    console.error("❌ [UPDATE] Lỗi khi cập nhật gian hàng:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật gian hàng",
      error: err.message,
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
      return res.status(401).json({
        success: false,
        message: "Chưa đăng nhập",
      });
    }

    const item = await cuahang.findByPk(MaCH);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy gian hàng",
      });
    }

    // 🟢 KIỂM TRA QUYỀN SỞ HỮU
    if (item.MaTK !== user.MaTK) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa cửa hàng này",
      });
    }

    // 🚨 KIỂM TRA CÓ SẢN PHẨM THUỘC CỬA HÀNG KHÔNG
    const productsCount = await sanpham.count({
      where: { MaCH: MaCH },
    });

    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa cửa hàng. Còn ${productsCount} sản phẩm thuộc cửa hàng này. Hãy xóa hoặc chuyển sản phẩm trước.`,
      });
    }

    await item.destroy({ transaction });
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
          as: "MaTK_taikhoan", // ✅ SỬA: Thêm alias
          attributes: ["MaTK", "TenDangNhap", "Email"],
        },
        {
          model: hinhanh,
          as: "MaHA_CuaHang_hinhanh",
          attributes: ["MaHA", "URL", "MoTa"],
        },
        {
          model: hdbanhang,
          as: "MaHD_hdbanhang", // ✅ SỬA: Thêm alias
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
