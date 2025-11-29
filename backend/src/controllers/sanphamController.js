// src/controllers/sanphamController.js
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Op } from "sequelize";
import path from "path";
import fs from "fs";

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
  const srcDir = path.dirname(new URL(import.meta.url).pathname);
  const backendDir = path.join(srcDir, "..", "..");
  const uploadDir = path.join(backendDir, "public", "uploads", type);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// ✅ Hàm này CHỈ tạo đường dẫn URL, KHÔNG ghi file nữa
const handleFileUpload = (file, type = "products") => {
  // Trường hợp 1: Dùng DiskStorage (Multer đã lưu file xong)
  if (file.filename) {
    // Trả về đường dẫn web: /uploads/products/ten-file.jpg
    return `/uploads/${type}/${file.filename}`;
  }

  // Trường hợp 2: Dùng MemoryStorage (Fallback - ít khi chạy nếu config đúng)
  if (file.buffer) {
    ensureUploadDir(type);
    const uploadDir = path.join(process.cwd(), "public", "uploads", type);
    const fileExt = path.extname(file.originalname);
    const fileName = `${type}_${Date.now()}_${Math.round(
      Math.random() * 1e9
    )}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, file.buffer); // Chỉ ghi file ở trường hợp này
    return `/uploads/${type}/${fileName}`;
  }

  throw new Error("File không hợp lệ (thiếu filename và buffer)");
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

// 🟢 TẠO MÃ SẢN PHẨM
const generateMaSP = async () => {
  const now = new Date();
  const productPrefix =
    "SP" +
    now.getFullYear().toString().slice(2) +
    String(now.getMonth() + 1).padStart(2, "0");

  const lastProduct = await sanpham.findOne({
    where: { MaSP: { [Op.like]: `${productPrefix}%` } },
    order: [["MaSP", "DESC"]],
  });

  let newProductId = productPrefix + "0001";
  if (lastProduct) {
    const lastNum = parseInt(lastProduct.MaSP.slice(6)) || 0;
    newProductId = productPrefix + String(lastNum + 1).padStart(4, "0");
  }

  return newProductId;
};

// 🟢 XỬ LÝ FORM DATA
const processFormData = (req) => {
  const body = { ...req.body };

  if (body.danhMucIds) {
    if (typeof body.danhMucIds === "string") {
      try {
        body.danhMucIds = JSON.parse(body.danhMucIds);
      } catch {
        body.danhMucIds = [body.danhMucIds];
      }
    }
  }

  if (body.xoaHinhAnhIds) {
    if (typeof body.xoaHinhAnhIds === "string") {
      try {
        body.xoaHinhAnhIds = JSON.parse(body.xoaHinhAnhIds);
      } catch {
        body.xoaHinhAnhIds = [body.xoaHinhAnhIds];
      }
    }
  }

  return body;
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

// 🟢 LẤY DANH SÁCH SẢN PHẨM VỚI BỘ LỌC
export const getAllSanpham = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      minPrice,
      maxPrice,
      minRating,
      danhMuc,
      loaiSanPham, // 🟢 THÊM FILTER LOẠI SẢN PHẨM
      sortBy = "newest",
      include,
      MaCH,
    } = req.query;

    const offset = (page - 1) * limit;
    let whereCondition = {};
    let includeOptions = [];
    let order = [];

    // 🟢 TÌM KIẾM THEO TÊN VÀ MÔ TẢ
    if (search) {
      whereCondition[Op.or] = [
        { TenSP: { [Op.like]: `%${search}%` } },
        { MoTa: { [Op.like]: `%${search}%` } },
      ];
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
      whereCondition.DiemDG_SP = { [Op.gte]: parseFloat(minRating) };
    }

    // 🟢 LỌC THEO CỬA HÀNG
    if (MaCH) {
      whereCondition.MaCH = MaCH;
    }

    // 🟢 LỌC THEO DANH MỤC (DANHMUC HIỆN CÓ)
    if (danhMuc) {
      const categoryIds = Array.isArray(danhMuc) ? danhMuc : [danhMuc];
      includeOptions.push({
        model: danhmuc,
        as: "MaDM_danhmucs",
        where: { MaDM: { [Op.in]: categoryIds } },
        through: { attributes: [] },
        required: true,
      });
    } else {
      includeOptions.push({
        model: danhmuc,
        as: "MaDM_danhmucs",
        through: { attributes: [] },
        required: false,
      });
    }

    // 🟢 LỌC THEO LOẠI SẢN PHẨM (TÌM THEO TÊN SẢN PHẨM)
    if (loaiSanPham) {
      const loaiSanPhamIds = Array.isArray(loaiSanPham)
        ? loaiSanPham
        : [loaiSanPham];

      // Map từ mã loại sang từ khóa tìm kiếm tiếng Việt
      const searchKeywords = loaiSanPhamIds.map((loai) => {
        const keywordMap = {
          apple: "táo",
          banana: "chuối",
          beetroot: "củ dền",
          "bell pepper": "ớt chuông",
          cabbage: "bắp cải",
          capsicum: "ớt ngọt",
          carrot: "cà rốt",
          cauliflower: "súp lơ",
          "chilli pepper": "ớt",
          corn: "ngô",
          cucumber: "dưa chuột",
          eggplant: "cà tím",
          garlic: "tỏi",
          ginger: "gừng",
          grapes: "nho",
          jalepeno: "ớt jalapeño",
          kiwi: "kiwi",
          lemon: "chanh",
          lettuce: "xà lách",
          mango: "xoài",
          onion: "hành tây",
          orange: "cam",
          paprika: "ớt bột",
          pear: "lê",
          peas: "đậu hà lan",
          pineapple: "dứa", // hoặc "thơm"
          pomegranate: "lựu",
          potato: "khoai tây",
          raddish: "củ cải",
          "soy beans": "đậu nành",
          spinach: "rau chân vịt", // hoặc "cải bó xôi"
          sweetcorn: "ngô ngọt",
          sweetpotato: "khoai lang",
          tomato: "cà chua",
          turnip: "củ cải trắng",
          watermelon: "dưa hấu",
        };
        return keywordMap[loai] || loai;
      });

      // Thêm điều kiện tìm kiếm theo tên sản phẩm
      whereCondition[Op.or] = [
        ...(whereCondition[Op.or] || []), // Giữ các điều kiện tìm kiếm cũ
        ...searchKeywords.map((keyword) => ({
          TenSP: {
            [Op.like]: `%${keyword}%`,
          },
        })),
      ];
    }

    // 🟢 SẮP XẾP
    switch (sortBy) {
      case "price_asc":
        order = [["GiaBan", "ASC"]];
        break;
      case "price_desc":
        order = [["GiaBan", "DESC"]];
        break;
      case "rating":
        order = [["DiemDG_SP", "DESC"]];
        break;
      case "name":
        order = [["TenSP", "ASC"]];
        break;
      case "newest":
      default:
        order = [["MaSP", "DESC"]];
        break;
    }

    // 🟢 INCLUDE OPTIONS
    if (include) {
      const includes = include.split(",");

      if (includes.includes("hinhanh")) {
        includeOptions.push({
          model: hinhanh,
          as: "hinhanhs",
          attributes: ["MaHA", "URL", "MoTa"],
          through: { attributes: [] },
          required: false,
        });
      }

      if (includes.includes("cuahang")) {
        includeOptions.push({
          model: cuahang,
          as: "cuahang",
          attributes: ["MaCH", "TenCH", "DiemDG"],
          required: false,
        });
      }
    }

    console.log("🔍 Filter conditions:", {
      loaiSanPham,
      danhMuc,
      search,
      minPrice,
      maxPrice,
      minRating,
    });

    const { count, rows: products } = await sanpham.findAndCountAll({
      where: whereCondition,
      include: includeOptions,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    console.log(`📊 Found ${count} products with filters`);

    res.json({
      success: true,
      message: "Lấy danh sách sản phẩm thành công",
      data: {
        products,
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

// 🟢 LẤY DANH MỤC VỚI SỐ LƯỢNG SẢN PHẨM
export const getCategoriesWithCount = async (req, res) => {
  try {
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
      order: [["TenDM", "ASC"]],
    });

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

// 🟢 LẤY CHI TIẾT SẢN PHẨM
export const getSanphamById = async (req, res) => {
  try {
    const { MaSP } = req.params;
    const { include } = req.query;

    let includeOptions = [
      {
        model: cuahang,
        as: "cuahang",
        attributes: ["MaCH", "TenCH", "DiemDG"],
      },
      {
        model: hinhanh,
        as: "hinhanhs",
        attributes: ["MaHA", "URL", "MoTa"],
        through: { attributes: [] },
      },
    ];

    if (include) {
      const includes = include.split(",");

      if (includes.includes("danhmuc")) {
        includeOptions.push({
          model: danhmuc,
          as: "MaDM_danhmucs",
          attributes: ["MaDM", "TenDM", "MoTa"],
          through: { attributes: [] },
        });
      }
    }

    const product = await sanpham.findByPk(MaSP, {
      include: includeOptions,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    res.json({
      success: true,
      message: "Lấy thông tin sản phẩm thành công",
      data: product,
    });
  } catch (err) {
    console.error("❌ Lỗi lấy thông tin sản phẩm:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 🟢 LẤY SẢN PHẨM THEO CỬA HÀNG
export const getSanphamByCuaHang = async (req, res) => {
  try {
    const { MaCH } = req.params;
    const {
      page = 1,
      limit = 10,
      include,
      search,
      danhMuc,
      trangThai,
    } = req.query;

    const offset = (page - 1) * limit;

    // Kiểm tra cửa hàng tồn tại
    const cuaHang = await cuahang.findByPk(MaCH);
    if (!cuaHang) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cửa hàng",
      });
    }

    let whereCondition = { MaCH };
    let includeOptions = [];

    // 🟢 LỌC THEO TÌM KIẾM
    if (search) {
      whereCondition[Op.or] = [
        { TenSP: { [Op.like]: `%${search}%` } },
        { MoTa: { [Op.like]: `%${search}%` } },
      ];
    }

    // 🟢 LỌC THEO TRẠNG THÁI
    if (trangThai) {
      whereCondition.TrangThai = trangThai;
    }

    // 🟢 LỌC THEO DANH MỤC
    if (danhMuc) {
      const categoryIds = Array.isArray(danhMuc) ? danhMuc : [danhMuc];
      includeOptions.push({
        model: danhmuc,
        as: "MaDM_danhmucs",
        where: { MaDM: { [Op.in]: categoryIds } },
        through: { attributes: [] },
        required: true,
      });
    } else {
      includeOptions.push({
        model: danhmuc,
        as: "MaDM_danhmucs",
        through: { attributes: [] },
        required: false,
      });
    }

    // 🟢 INCLUDE HÌNH ẢNH
    if (include && include.includes("hinhanh")) {
      includeOptions.push({
        model: hinhanh,
        as: "hinhanhs",
        attributes: ["MaHA", "URL", "MoTa"],
        through: { attributes: [] },
        required: false,
      });
    }

    const { count, rows: products } = await sanpham.findAndCountAll({
      where: whereCondition,
      include: includeOptions,
      order: [["TenSP", "ASC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    res.json({
      success: true,
      message: "Lấy danh sách sản phẩm theo cửa hàng thành công",
      data: {
        store: {
          MaCH: cuaHang.MaCH,
          TenCH: cuaHang.TenCH,
        },
        products,
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

const getUploadedFiles = (req) => {
  if (!req.files) return [];

  // Trường hợp 1: upload.array('images') -> req.files là mảng
  if (Array.isArray(req.files)) {
    return req.files;
  }

  // Trường hợp 2: upload.fields -> req.files là object { images: [...], hinhAnh: [...] }
  let files = [];
  if (req.files.images) files = files.concat(req.files.images);
  if (req.files.hinhAnh) files = files.concat(req.files.hinhAnh);
  if (req.files.hinhAnhMoi) files = files.concat(req.files.hinhAnhMoi);

  return files;
};

// 🟢 TẠO SẢN PHẨM MỚI VỚI NHIỀU HÌNH ẢNH
export const createSanpham = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    console.log("📦 Creating product with data:", req.body);

    // 🟢 XÁC THỰC USER
    const user = await authenticateUser(req);

    // 🟢 XỬ LÝ FORM DATA
    const processedBody = processFormData(req);
    const {
      TenSP,
      MoTa,
      DVT,
      HSD,
      TrangThai = "Đang bán",
      GiaBan,
      NguonGoc,
      SLTon,
      danhMucIds,
    } = processedBody;

    // VALIDATION
    if (!TenSP || TenSP.trim() === "") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Tên sản phẩm không được để trống",
      });
    }

    if (!GiaBan || parseFloat(GiaBan) < 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Giá bán không hợp lệ",
      });
    }

    if (!SLTon || parseInt(SLTon) < 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Số lượng tồn không hợp lệ",
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

    // 🟢 TẠO MÃ SẢN PHẨM TỰ ĐỘNG
    const MaSP = await generateMaSP();

    // 🟢 TẠO SẢN PHẨM MỚI
    const newProduct = await sanpham.create(
      {
        MaSP,
        MaCH: cuaHang.MaCH,
        TenSP: TenSP.trim(),
        MoTa: MoTa?.trim() || null,
        DVT: DVT?.trim() || "cái",
        HSD: HSD || null,
        TrangThai: TrangThai,
        GiaBan: parseFloat(GiaBan),
        NguonGoc: NguonGoc?.trim() || null,
        SLTon: parseInt(SLTon),
        DiemDG_SP: 0,
        SoLuongDanhGia_SP: 0,
      },
      { transaction }
    );

    console.log("✅ Product created:", newProduct.MaSP);

    // 🟢 XỬ LÝ HÌNH ẢNH - NHIỀU ẢNH
    const imageFiles = getUploadedFiles(req);
    console.log(`📸 Tìm thấy ${imageFiles.length} ảnh để xử lý...`);

    let uploadedImages = [];

    // 🟢 BƯỚC 2: Chạy vòng lặp xử lý
    if (imageFiles.length > 0) {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];

        try {
          // 1. Tạo mã hình ảnh (Database ID)
          const MaHA = await generateMaHA();

          const imageUrl = handleFileUpload(file, "products");

          // 3. Lưu vào bảng 'hinhanh'
          const newImage = await hinhanh.create(
            {
              MaHA,
              URL: imageUrl, // Ví dụ: /uploads/products/product-123...jpg
              MoTa: `Hình ảnh ${i + 1} của sản phẩm ${TenSP}`,
            },
            { transaction }
          );

          // 4. Lưu vào bảng trung gian 'sanpham_hinhanh'
          await sanpham_hinhanh.create(
            {
              MaSP: newProduct.MaSP,
              MaHA: newImage.MaHA,
            },
            { transaction }
          );

          // 5. Thêm vào mảng kết quả để trả về client (nếu cần)
          uploadedImages.push({
            MaHA: newImage.MaHA,
            URL: imageUrl,
            MoTa: newImage.MoTa,
          });

          console.log(`✅ Đã liên kết ảnh ${i + 1}: ${imageUrl}`);
        } catch (imageError) {
          console.error(`❌ Lỗi xử lý ảnh thứ ${i + 1}:`, imageError);
        }
      }
    }

    // 🟢 XỬ LÝ DANH MỤC
    let assignedCategories = [];
    if (danhMucIds && danhMucIds.length > 0) {
      const categoryIds = Array.isArray(danhMucIds)
        ? danhMucIds
        : typeof danhMucIds === "string"
        ? [danhMucIds]
        : [];

      const validCategoryIds = categoryIds.filter(
        (id) => !id.startsWith("CUSTOM_")
      );

      if (validCategoryIds.length > 0) {
        const existingCategories = await danhmuc.findAll({
          where: { MaDM: { [Op.in]: validCategoryIds } },
          transaction,
        });

        const validCategoryAssociations = existingCategories.map((cat) => ({
          MaSP: newProduct.MaSP,
          MaDM: cat.MaDM,
        }));

        if (validCategoryAssociations.length > 0) {
          await sanpham_danhmuc.bulkCreate(validCategoryAssociations, {
            transaction,
          });
          assignedCategories = existingCategories.map((cat) => ({
            MaDM: cat.MaDM,
            TenDM: cat.TenDM,
            MoTa: cat.MoTa,
          }));
        }
      }
    }

    await transaction.commit();

    // 🟢 LẤY LẠI SẢN PHẨM VỚI THÔNG TIN ĐẦY ĐỦ
    const productWithDetails = await sanpham.findByPk(newProduct.MaSP, {
      include: [
        {
          model: danhmuc,
          as: "MaDM_danhmucs",
          attributes: ["MaDM", "TenDM", "MoTa"],
          through: { attributes: [] },
        },
        {
          model: hinhanh,
          as: "hinhanhs",
          attributes: ["MaHA", "URL", "MoTa"],
          through: { attributes: [] },
        },
        {
          model: cuahang,
          as: "cuahang",
          attributes: ["MaCH", "TenCH", "DiemDG"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Tạo sản phẩm thành công",
      data: productWithDetails,
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

    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 🟢 CẬP NHẬT SẢN PHẨM VỚI QUẢN LÝ HÌNH ẢNH
export const updateSanpham = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { MaSP } = req.params;

    // 🟢 XÁC THỰC USER
    const user = await authenticateUser(req);

    // Tìm sản phẩm
    const product = await sanpham.findByPk(MaSP, { transaction });
    if (!product) {
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

    // KIỂM TRA QUYỀN SỞ HỮU
    if (product.MaCH !== cuaHang.MaCH) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật sản phẩm này",
      });
    }

    // 🟢 XỬ LÝ FORM DATA
    const processedBody = processFormData(req);
    const {
      TenSP,
      MoTa,
      DVT,
      HSD,
      TrangThai,
      GiaBan,
      NguonGoc,
      SLTon,
      danhMucIds,
      xoaHinhAnhIds,
    } = processedBody;

    // VALIDATION
    if (TenSP !== undefined && TenSP.trim() === "") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Tên sản phẩm không được để trống",
      });
    }

    if (GiaBan !== undefined && parseFloat(GiaBan) < 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Giá bán không được âm",
      });
    }

    if (SLTon !== undefined && parseInt(SLTon) < 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Số lượng tồn không được âm",
      });
    }

    // 🟢 CẬP NHẬT THÔNG TIN SẢN PHẨM
    const updateData = {};
    if (TenSP !== undefined) updateData.TenSP = TenSP.trim();
    if (MoTa !== undefined) updateData.MoTa = MoTa?.trim() || null;
    if (DVT !== undefined) updateData.DVT = DVT?.trim() || "cái";
    if (HSD !== undefined) updateData.HSD = HSD;
    if (TrangThai !== undefined) updateData.TrangThai = TrangThai;
    if (GiaBan !== undefined) updateData.GiaBan = parseFloat(GiaBan);
    if (NguonGoc !== undefined) updateData.NguonGoc = NguonGoc?.trim() || null;
    if (SLTon !== undefined) updateData.SLTon = parseInt(SLTon);

    await product.update(updateData, { transaction });

    // 🟢 XỬ LÝ XÓA HÌNH ẢNH
    if (xoaHinhAnhIds && xoaHinhAnhIds.length > 0) {
      const deleteIds = Array.isArray(xoaHinhAnhIds)
        ? xoaHinhAnhIds
        : [xoaHinhAnhIds];

      console.log(`🗑️ Deleting ${deleteIds.length} images...`);

      // Lấy thông tin hình ảnh để xóa file vật lý
      const imagesToDelete = await hinhanh.findAll({
        where: { MaHA: { [Op.in]: deleteIds } },
        transaction,
      });

      // Xóa liên kết với sản phẩm
      await sanpham_hinhanh.destroy({
        where: {
          MaSP: MaSP,
          MaHA: { [Op.in]: deleteIds },
        },
        transaction,
      });

      // Xóa bản ghi hình ảnh
      await hinhanh.destroy({
        where: {
          MaHA: { [Op.in]: deleteIds },
        },
        transaction,
      });

      // Xóa file vật lý
      imagesToDelete.forEach((image) => {
        deletePhysicalFile(image.URL);
      });
    }

    // 🟢 XỬ LÝ THÊM HÌNH ẢNH MỚI
    if (req.files && (req.files.images || req.files.hinhAnhMoi)) {
      const files = req.files.images || req.files.hinhAnhMoi;
      const imageFiles = Array.isArray(files) ? files : [files];

      console.log(`📸 Adding ${imageFiles.length} new images...`);

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];

        try {
          const MaHA = await generateMaHA();
          const imageUrl = handleFileUpload(file, "products");

          const newImage = await hinhanh.create(
            {
              MaHA,
              URL: imageUrl,
              MoTa: `Hình ảnh mới của sản phẩm ${product.TenSP}`,
            },
            { transaction }
          );

          await sanpham_hinhanh.create(
            {
              MaSP: MaSP,
              MaHA: newImage.MaHA,
            },
            { transaction }
          );

          console.log(`✅ Added new image ${i + 1}: ${MaHA}`);
        } catch (imageError) {
          console.error(`❌ Lỗi upload ảnh mới ${i + 1}:`, imageError);
        }
      }
    }

    // 🟢 CẬP NHẬT DANH MỤC
    if (danhMucIds !== undefined) {
      await sanpham_danhmuc.destroy({
        where: { MaSP: MaSP },
        transaction,
      });

      const categoryIds = Array.isArray(danhMucIds)
        ? danhMucIds
        : danhMucIds
        ? [danhMucIds]
        : [];
      const validCategoryIds = categoryIds.filter(
        (id) => !id.startsWith("CUSTOM_")
      );

      if (validCategoryIds.length > 0) {
        const existingCategories = await danhmuc.findAll({
          where: { MaDM: { [Op.in]: validCategoryIds } },
          transaction,
        });

        const validCategoryAssociations = existingCategories.map((cat) => ({
          MaSP: MaSP,
          MaDM: cat.MaDM,
        }));

        if (validCategoryAssociations.length > 0) {
          await sanpham_danhmuc.bulkCreate(validCategoryAssociations, {
            transaction,
          });
        }
      }
    }

    await transaction.commit();

    // 🟢 LẤY LẠI SẢN PHẨM VỚI THÔNG TIN ĐẦY ĐỦ
    const updatedProduct = await sanpham.findByPk(MaSP, {
      include: [
        {
          model: danhmuc,
          as: "MaDM_danhmucs",
          attributes: ["MaDM", "TenDM", "MoTa"],
          through: { attributes: [] },
        },
        {
          model: hinhanh,
          as: "hinhanhs",
          attributes: ["MaHA", "URL", "MoTa"],
          through: { attributes: [] },
        },
        {
          model: cuahang,
          as: "cuahang",
          attributes: ["MaCH", "TenCH", "DiemDG"],
        },
      ],
    });

    res.json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
      data: updatedProduct,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Lỗi cập nhật sản phẩm:", err);

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

// 🟢 XÓA SẢN PHẨM
export const deleteSanpham = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { MaSP } = req.params;

    // 🟢 XÁC THỰC USER
    const user = await authenticateUser(req);

    // 1. Tìm sản phẩm VÀ KÈM THEO HÌNH ẢNH LUÔN
    // Dùng alias "hinhanhs" là chuẩn vì đang query từ sanpham
    const product = await sanpham.findByPk(MaSP, {
      include: [
        {
          model: hinhanh,
          as: "hinhanhs", // ✅ Alias đúng chiều: Sản phẩm -> Hình ảnh
          through: { attributes: [] },
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

    // 2. Tìm cửa hàng của user
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

    // 3. KIỂM TRA QUYỀN SỞ HỮU
    if (product.MaCH !== cuaHang.MaCH) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa sản phẩm này",
      });
    }

    // 4. Xóa file hình ảnh vật lý trước
    if (product.hinhanhs && product.hinhanhs.length > 0) {
      product.hinhanhs.forEach((image) => {
        // Đảm bảo hàm deletePhysicalFile đã được khai báo ở trên
        // Nếu chưa có hàm riêng, có thể dùng code fs.unlinkSync trực tiếp tại đây
        try {
          const filePath = path.join(process.cwd(), "public", image.URL);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (e) {
          console.log("Không xóa được file:", image.URL);
        }
      });
    }

    // 5. Xóa dữ liệu liên quan trong DB
    // Xóa liên kết danh mục
    await sanpham_danhmuc.destroy({
      where: { MaSP: MaSP },
      transaction,
    });

    // Xóa liên kết hình ảnh (sanpham_hinhanh)
    await sanpham_hinhanh.destroy({
      where: { MaSP: MaSP },
      transaction,
    });

    // Xóa bản ghi trong bảng hinhanh (nếu muốn xóa triệt để khỏi DB)
    const imageIds = product.hinhanhs.map((img) => img.MaHA);
    if (imageIds.length > 0) {
      await hinhanh.destroy({
        where: { MaHA: imageIds },
        transaction,
      });
    }

    // 6. Xóa sản phẩm
    await product.destroy({ transaction });

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

    if (err.message.includes("Token") || err.message.includes("đăng nhập")) {
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

// 🟢 LẤY SẢN PHẨM CỦA CỬA HÀNG TÔI
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

    const {
      page = 1,
      limit = 10,
      include,
      search,
      danhMuc,
      trangThai,
    } = req.query;
    const offset = (page - 1) * limit;

    let whereCondition = { MaCH: cuaHang.MaCH };
    let includeOptions = [];

    // 🟢 LỌC THEO TÌM KIẾM
    if (search) {
      whereCondition[Op.or] = [
        { TenSP: { [Op.like]: `%${search}%` } },
        { MoTa: { [Op.like]: `%${search}%` } },
      ];
    }

    // 🟢 LỌC THEO TRẠNG THÁI
    if (trangThai) {
      whereCondition.TrangThai = trangThai;
    }

    // 🟢 LỌC THEO DANH MỤC
    if (danhMuc) {
      const categoryIds = Array.isArray(danhMuc) ? danhMuc : [danhMuc];
      includeOptions.push({
        model: danhmuc,
        as: "MaDM_danhmucs",
        where: { MaDM: { [Op.in]: categoryIds } },
        through: { attributes: [] },
        required: true,
      });
    } else {
      includeOptions.push({
        model: danhmuc,
        as: "MaDM_danhmucs",
        through: { attributes: [] },
        required: false,
      });
    }

    // 🟢 INCLUDE HÌNH ẢNH
    if (include && include.includes("hinhanh")) {
      includeOptions.push({
        model: hinhanh,
        as: "hinhanhs",
        attributes: ["MaHA", "URL", "MoTa"],
        through: { attributes: [] },
        required: false,
      });
    }

    const { count, rows: products } = await sanpham.findAndCountAll({
      where: whereCondition,
      include: includeOptions,
      order: [["MaSP", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    res.json({
      success: true,
      message: "Lấy danh sách sản phẩm của bạn thành công",
      data: {
        store: {
          MaCH: cuaHang.MaCH,
          TenCH: cuaHang.TenCH,
        },
        products,
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
      danhMuc,
      page = 1,
      limit = 12,
      sortBy = "newest",
    } = req.query;

    const offset = (page - 1) * limit;
    let whereCondition = {};
    let includeOptions = [];
    let order = [];

    // 🟢 TÌM KIẾM THEO TỪ KHÓA
    if (keyword) {
      whereCondition[Op.or] = [
        { TenSP: { [Op.like]: `%${keyword}%` } },
        { MoTa: { [Op.like]: `%${keyword}%` } },
        { NguonGoc: { [Op.like]: `%${keyword}%` } },
      ];
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
      whereCondition.DiemDG_SP = { [Op.gte]: parseFloat(minRating) };
    }

    // 🟢 LỌC THEO CỬA HÀNG
    if (MaCH) {
      whereCondition.MaCH = MaCH;
    }

    // 🟢 LỌC THEO DANH MỤC
    if (danhMuc) {
      const categoryIds = Array.isArray(danhMuc) ? danhMuc : [danhMuc];
      includeOptions.push({
        model: danhmuc,
        as: "MaDM_danhmucs",
        where: { MaDM: { [Op.in]: categoryIds } },
        through: { attributes: [] },
        required: true,
      });
    }

    // 🟢 SẮP XẾP
    switch (sortBy) {
      case "price_asc":
        order = [["GiaBan", "ASC"]];
        break;
      case "price_desc":
        order = [["GiaBan", "DESC"]];
        break;
      case "rating":
        order = [["DiemDG_SP", "DESC"]];
        break;
      case "name":
        order = [["TenSP", "ASC"]];
        break;
      case "newest":
      default:
        order = [["MaSP", "DESC"]];
        break;
    }

    // 🟢 INCLUDE THÔNG TIN BỔ SUNG
    includeOptions.push(
      {
        model: cuahang,
        as: "cuahang",
        attributes: ["MaCH", "TenCH", "DiemDG"],
      },
      {
        model: hinhanh,
        as: "hinhanhs",
        attributes: ["MaHA", "URL", "MoTa"],
        through: { attributes: [] },
        required: false,
      }
    );

    const { count, rows: products } = await sanpham.findAndCountAll({
      where: whereCondition,
      include: includeOptions,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    res.json({
      success: true,
      message: "Tìm kiếm sản phẩm thành công",
      data: {
        products,
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

// 🟢 THỐNG KÊ SẢN PHẨM
export const getProductStats = async (req, res) => {
  try {
    const user = await authenticateUser(req);

    const cuaHang = await cuahang.findOne({
      where: { MaTK: user.MaTK },
    });

    if (!cuaHang) {
      return res.status(404).json({
        success: false,
        message: "Bạn không có cửa hàng",
      });
    }

    const totalProducts = await sanpham.count({
      where: { MaCH: cuaHang.MaCH },
    });

    const activeProducts = await sanpham.count({
      where: {
        MaCH: cuaHang.MaCH,
        TrangThai: "Đang bán",
      },
    });

    const outOfStockProducts = await sanpham.count({
      where: {
        MaCH: cuaHang.MaCH,
        SLTon: 0,
      },
    });

    const totalValue = await sanpham.sum("GiaBan", {
      where: { MaCH: cuaHang.MaCH },
    });

    // Thống kê hình ảnh
    const productsWithImages = await sanpham.findAll({
      where: { MaCH: cuaHang.MaCH },
      include: [
        {
          model: hinhanh,
          as: "hinhanhs",
          attributes: ["MaHA"],
          through: { attributes: [] },
        },
      ],
    });

    const totalImages = productsWithImages.reduce((total, product) => {
      return total + product.hinhanhs.length;
    }, 0);

    const productsWithoutImages = productsWithImages.filter(
      (product) => product.hinhanhs.length === 0
    ).length;

    res.json({
      success: true,
      message: "Lấy thống kê sản phẩm thành công",
      data: {
        totalProducts,
        activeProducts,
        outOfStockProducts,
        totalValue: totalValue || 0,
        images: {
          totalImages,
          productsWithoutImages,
          averageImagesPerProduct:
            totalProducts > 0 ? (totalImages / totalProducts).toFixed(2) : 0,
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

    console.error("❌ Lỗi lấy thống kê sản phẩm:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

// 🟢 THÊM HÌNH ẢNH CHO SẢN PHẨM
export const addImagesToProduct = async (req, res) => {
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
    if (!req.files || (!req.files.images && !req.files.hinhAnh)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn hình ảnh để upload",
      });
    }

    const files = req.files.images || req.files.hinhAnh;
    const imageFiles = Array.isArray(files) ? files : [files];

    let uploadedImages = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];

      try {
        const MaHA = await generateMaHA();
        const imageUrl = handleFileUpload(file, "products");

        const newImage = await hinhanh.create(
          {
            MaHA,
            URL: imageUrl,
            MoTa: MoTa || `Hình ảnh ${i + 1} của sản phẩm ${product.TenSP}`,
          },
          { transaction }
        );

        await sanpham_hinhanh.create(
          {
            MaSP: product.MaSP,
            MaHA: newImage.MaHA,
          },
          { transaction }
        );

        uploadedImages.push({
          MaHA: newImage.MaHA,
          URL: imageUrl,
          MoTa: newImage.MoTa,
        });
      } catch (imageError) {
        console.error(`❌ Lỗi upload ảnh ${i + 1}:`, imageError);
      }
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: `Thêm ${uploadedImages.length} hình ảnh cho sản phẩm thành công`,
      data: uploadedImages,
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

// 🟢 XÓA HÌNH ẢNH CỦA SẢN PHẨM
export const deleteProductImage = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { MaSP, MaHA } = req.params;

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
        message: "Bạn không có quyền xóa hình ảnh của sản phẩm này",
      });
    }

    // Kiểm tra hình ảnh tồn tại và thuộc về sản phẩm
    const imageAssociation = await sanpham_hinhanh.findOne({
      where: { MaSP, MaHA },
      include: [
        {
          model: hinhanh,
          as: "MaHA_hinhanh",
        },
      ],
      transaction,
    });

    if (!imageAssociation) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message:
          "Không tìm thấy hình ảnh hoặc hình ảnh không thuộc về sản phẩm này",
      });
    }

    // Xóa liên kết
    await sanpham_hinhanh.destroy({
      where: { MaSP, MaHA },
      transaction,
    });

    // Xóa bản ghi hình ảnh
    await hinhanh.destroy({
      where: { MaHA },
      transaction,
    });

    // Xóa file vật lý
    deletePhysicalFile(imageAssociation.MaHA_hinhanh.URL);

    await transaction.commit();

    res.json({
      success: true,
      message: "Xóa hình ảnh thành công",
      data: {
        deletedImage: MaHA,
        product: MaSP,
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

    console.error("❌ Lỗi xóa hình ảnh sản phẩm:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + err.message,
    });
  }
};

export const getProductsForAI = async () => {
  try {
    // Lấy 30 sản phẩm mới nhất hoặc bán chạy nhất
    // Chỉ lấy các trường cần thiết để tiết kiệm token cho AI
    const products = await sanpham.findAll({
      limit: 30,
      where: {
        TrangThai: { [Op.or]: ["Đang bán", "active"] }, // Chỉ lấy hàng đang bán
      },
      attributes: ["TenSP", "GiaBan", "SLTon", "MoTa", "DVT"], // Chỉ lấy thông tin quan trọng
      include: [
        {
          model: cuahang,
          as: "cuahang",
          attributes: ["TenCH"], // Lấy thêm tên cửa hàng
        },
      ],
      order: [["MaSP", "DESC"]], // Sản phẩm mới nhất
    });

    // Map dữ liệu cho gọn
    return products.map((p) => ({
      ten: p.TenSP,
      gia: p.GiaBan,
      ton_kho: p.SLTon,
      dvt: p.DVT,
      cua_hang: p.cuahang?.TenCH || "SAP",
      mo_ta_ngan: p.MoTa ? p.MoTa.substring(0, 100) + "..." : "",
    }));
  } catch (error) {
    console.error("❌ Lỗi lấy data cho AI:", error);
    return []; // Trả về mảng rỗng nếu lỗi, không throw để tránh crash AI
  }
};
