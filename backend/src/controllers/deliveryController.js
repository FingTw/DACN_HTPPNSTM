import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url"; // Cần thêm để xử lý đường dẫn trong ES Modules

const models = initModels(sequelize);
const {
  donhang,
  chitiet_donhang,
  sanpham,
  giohang,
  ctgh,
  taikhoan,
  giaohang,
  cuahang,
  giaodich_vi,
  thanhtoan,
  pttt,
  taikhoan_vaitro,
  vaitro,
} = models;

/* ============================
 📂 0. Cấu hình Upload Helper (MỚI)
============================ */

// 🟢 TẠO THƯ MỤC UPLOAD (Logic mới)
const ensureUploadDir = (type = "products") => {
  // Fix lỗi đường dẫn trên Windows/Linux cho ES Modules
  const __filename = fileURLToPath(import.meta.url);
  const srcDir = path.dirname(__filename);

  // Đi từ src/controllers -> src -> backend -> public -> uploads
  const backendDir = path.join(srcDir, "..", "..");
  const uploadDir = path.join(backendDir, "public", "uploads", type);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// ✅ Hàm xử lý file trả về URL (Logic mới)
const handleFileUpload = (file, type = "products") => {
  // Trường hợp 1: Dùng DiskStorage (Multer đã lưu file xong)
  if (file.filename) {
    // Trả về đường dẫn web: /uploads/delivery/ten-file.jpg
    return `/uploads/${type}/${file.filename}`;
  }

  // Trường hợp 2: Dùng MemoryStorage (Fallback)
  if (file.buffer) {
    const uploadDir = ensureUploadDir(type);
    const fileExt = path.extname(file.originalname);
    const fileName = `${type}_${Date.now()}_${Math.round(
      Math.random() * 1e9
    )}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, file.buffer);
    return `/uploads/${type}/${fileName}`;
  }

  throw new Error("File không hợp lệ (thiếu filename và buffer)");
};

/* ============================
 📂 1. Cấu hình Multer cho Delivery
============================ */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Sử dụng hàm helper để lấy đường dẫn tuyệt đối
    const dir = ensureUploadDir("delivery");
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Đặt tên file unique
    const uniqueName = `delivery_${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ cho phép file JPG hoặc PNG"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("image");

/* ============================
 💰 Helper: Cộng tiền cho cửa hàng
============================ */
const creditStoresForOrder = async (MaDH, transaction) => {
  const orderDetails = await chitiet_donhang.findAll({
    where: { MaDH },
    include: [
      {
        model: sanpham,
        as: "MaSP_sanpham",
        attributes: ["MaCH", "GiaBan"],
      },
    ],
    transaction,
  });

  const revenueByShop = {};
  for (const item of orderDetails) {
    const maCH = item.MaSP_sanpham?.MaCH;
    const amount = parseFloat(item.GiaBan || 0) * (item.SoLuong || 1);
    if (!maCH) continue;
    revenueByShop[maCH] = (revenueByShop[maCH] || 0) + amount;
  }

  for (const [maCH, totalAmount] of Object.entries(revenueByShop)) {
    const shop = await cuahang.findByPk(maCH, { transaction });
    if (!shop) continue;

    const newBalance = parseFloat(shop.SoDu || 0) + Number(totalAmount);
    await cuahang.update(
      { SoDu: newBalance },
      { where: { MaCH: maCH }, transaction }
    );
  }
};

/* ============================
 🚚 2. Admin gán Shipper cho đơn hàng
============================ */
export const assignDelivery = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không có token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "Admin") {
      return res.status(403).json({ message: "Chỉ admin được assign shipper" });
    }

    const { MaDH, MaTK, GhiChu } = req.body;
    if (!MaDH || !MaTK) {
      return res
        .status(400)
        .json({ message: "Thiếu MaDH hoặc MaTK (Shipper)" });
    }

    const order = await donhang.findByPk(MaDH);
    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }

    const shipperAcc = await taikhoan.findByPk(MaTK);
    if (!shipperAcc) {
      return res
        .status(404)
        .json({ message: "Tài khoản Shipper không tồn tại" });
    }

    const shipperRole = await taikhoan_vaitro.findOne({
      where: { MaTK },
      include: [{ model: vaitro, as: "vaitro", where: { TenVT: "Shipper" } }],
    });

    if (!shipperRole) {
      return res.status(400).json({ message: "Tài khoản không phải Shipper" });
    }

    const MaGH =
      "GH" + uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();

    const record = await giaohang.create({
      MaGH,
      MaShipper: MaTK,
      MaDH,
      TrangThai: "ASSIGNED",
      GhiChu,
      NgayTao: new Date(),
    });

    return res.json({
      success: true,
      message: "Gán Shipper thành công",
      data: record,
    });
  } catch (err) {
    console.error("🔥 assignDelivery:", err);
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

/* ============================
 🚚 3. Shipper Lấy hàng
============================ */
export const shipperPickupOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { MaDH } = req.body;
    const MaShipper = req.user.MaTK;

    const order = await donhang.findByPk(MaDH, { transaction: t });

    if (
      order.TrangThai !== "Chờ lấy hàng" &&
      order.TrangThai !== "Đang đi lấy"
    ) {
      await t.rollback();
      return res.status(400).json({
        message: `Trạng thái đơn hàng không hợp lệ (${order.TrangThai})`,
      });
    }

    await donhang.update(
      { TrangThai: "Đang giao hàng", NgayCapNhat: new Date() },
      { where: { MaDH }, transaction: t }
    );

    await giaohang.update(
      { TrangThai: "PICKED_UP", ThoiGianLayHang: new Date() },
      { where: { MaDH, MaShipper }, transaction: t }
    );

    const { lichsu_trangthai } = initModels(sequelize);
    await lichsu_trangthai.create(
      {
        MaLS: "LS" + uuidv4().substring(0, 8).toUpperCase(),
        MaDH,
        TrangThaiCu: "Chờ lấy hàng",
        TrangThaiMoi: "Đang giao hàng",
        NguoiCapNhat: MaShipper,
        NgayCapNhat: new Date(),
        GhiChu: "Shipper đã lấy hàng thành công",
      },
      { transaction: t }
    );

    await t.commit();
    res.json({
      success: true,
      message: "Đã lấy hàng thành công. Trạng thái đơn: Đang giao hàng.",
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};

/* ============================
 📸 4. Shipper Upload bằng chứng giao hàng (UPDATE LOGIC MỚI)
============================ */
export const shipperUploadProof = (req, res) => {
  upload(req, res, async (err) => {
    if (err)
      return res.status(400).json({ message: "Lỗi upload: " + err.message });

    // Kiểm tra xem có file không
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn ảnh minh chứng" });
    }

    const t = await sequelize.transaction();
    try {
      const { MaGH } = req.params;
      const gh = await giaohang.findByPk(MaGH, { transaction: t });

      if (!gh) {
        await t.rollback();
        // Nếu file đã lỡ upload thì nên xóa đi để tránh rác (optional)
        return res
          .status(404)
          .json({ message: "Không tìm thấy đơn giao hàng" });
      }

      // ✅ Dùng hàm helper handleFileUpload để lấy đường dẫn chuẩn
      const imagePath = handleFileUpload(req.file, "delivery");

      // Cập nhật bảng GiaoHang
      gh.ProofImage = imagePath;
      gh.TrangThai = "DELIVERED_BY_SHIPPER";
      await gh.save({ transaction: t });

      // Cập nhật bảng DonHang
      await donhang.update(
        {
          TrangThai: "Đã giao",
          NgayCapNhat: new Date(),
        },
        { where: { MaDH: gh.MaDH }, transaction: t }
      );

      // Ghi lịch sử
      const { lichsu_trangthai } = initModels(sequelize);
      await lichsu_trangthai.create(
        {
          MaLS: "LS" + uuidv4().substring(0, 8).toUpperCase(),
          MaDH: gh.MaDH,
          TrangThaiCu: "Đang giao hàng",
          TrangThaiMoi: "Đã giao",
          NguoiCapNhat: req.user?.MaTK || gh.MaShipper,
          NgayCapNhat: new Date(),
          GhiChu: "Shipper đã giao hàng thành công & upload ảnh",
        },
        { transaction: t }
      );

      await t.commit();
      res.json({
        success: true,
        message: "Báo cáo giao hàng thành công. Chờ khách xác nhận.",
        data: {
          proofImage: imagePath,
        },
      });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  });
};

/* ============================
 🚚 5. Shipper Nhận đơn
============================ */
export const shipperTakeOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const MaShipper = req.user.MaTK;
    const { MaDH } = req.body;

    const order = await donhang.findByPk(MaDH, { transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }

    let nextStatus = "";
    if (order.TrangThai === "Chờ lấy hàng") {
      nextStatus = "Đang đi lấy";
    } else if (order.TrangThai === "Chờ giao hàng") {
      nextStatus = "Đang giao hàng";
    } else {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "Trạng thái đơn hàng không khả dụng để nhận." });
    }

    let gh = await giaohang.findOne({ where: { MaDH }, transaction: t });
    if (gh) {
      if (gh.MaShipper && gh.MaShipper !== MaShipper) {
        await t.rollback();
        return res
          .status(400)
          .json({ message: "Đơn này đã có shipper khác nhận" });
      }
      gh.MaShipper = MaShipper;
      gh.TrangThai = "ASSIGNED";
      await gh.save({ transaction: t });
    } else {
      await giaohang.create(
        {
          MaGH: "GH" + uuidv4().substring(0, 8).toUpperCase(),
          MaShipper,
          MaDH,
          TrangThai: "ASSIGNED",
          NgayTao: new Date(),
        },
        { transaction: t }
      );
    }

    await donhang.update(
      { TrangThai: nextStatus },
      { where: { MaDH }, transaction: t }
    );

    await t.commit();
    res.json({ success: true, message: `Đã nhận đơn: ${nextStatus}` });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

/* ============================
 ✅ 6. Khách hàng xác nhận (Giữ nguyên)
============================ */
export const customerConfirmDelivery = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không có token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const MaTK = decoded.MaTK;

    const { MaGH } = req.params;
    const record = await giaohang.findByPk(MaGH, {
      include: [{ model: donhang, as: "MaDH_donhang" }],
    });

    if (!record)
      return res
        .status(404)
        .json({ message: "Không tìm thấy bản ghi giao hàng" });

    const order = record.MaDH_donhang;
    if (!order)
      return res
        .status(404)
        .json({ message: "Đơn hàng liên quan không tồn tại" });

    if (order.TrangThai === "Hoàn thành") {
      return res.json({
        success: true,
        message: "Đơn đã được xác nhận trước đó",
        data: record,
      });
    }

    if (order.MaTK !== MaTK) {
      return res.status(403).json({ message: "Bạn không phải chủ đơn này" });
    }

    const ptttRecord = await pttt.findByPk(order.MaPTTT);
    if (!ptttRecord)
      return res
        .status(400)
        .json({ message: "Không tìm thấy phương thức thanh toán" });

    const tenPTTT = ptttRecord.TenPTTT?.toLowerCase() || "";
    const isBankTransfer = tenPTTT.includes("chuyển khoản ngân hàng");

    if (!isBankTransfer) {
      return res.status(400).json({
        message:
          "Xác nhận chỉ áp dụng cho đơn thanh toán bằng chuyển khoản ngân hàng",
      });
    }

    if (!record.ProofImage || record.TrangThai !== "DELIVERED_BY_SHIPPER") {
      return res
        .status(400)
        .json({ message: "Chưa có bằng chứng giao hàng từ shipper" });
    }

    const t = await sequelize.transaction();
    try {
      record.TrangThai = "RECEIVED_BY_CUSTOMER";
      await record.save({ transaction: t });

      await donhang.update(
        { TrangThai: "Hoàn thành" },
        { where: { MaDH: order.MaDH }, transaction: t }
      );

      const tt = await thanhtoan.findOne({
        where: { MaDH: order.MaDH },
        transaction: t,
      });
      if (tt) {
        tt.TrangThai = "Đã thanh toán";
        tt.NgayTao = new Date();
        tt.Thoigian = new Date().toLocaleTimeString("vi-VN", {
          hour12: false,
          timeZone: "Asia/Ho_Chi_Minh",
        });
        await tt.save({ transaction: t });
      }

      await creditStoresForOrder(order.MaDH, t);

      await t.commit();
      res.json({
        success: true,
        message: "Khách hàng đã xác nhận, đơn hoàn thành (chuyển khoản)",
        data: record,
      });
    } catch (errTx) {
      await t.rollback();
      console.error("🔥 customerConfirmDelivery (tx):", errTx);
      res
        .status(500)
        .json({ message: "Lỗi khi xác nhận đơn hàng", error: errTx.message });
    }
  } catch (err) {
    console.error("🔥 customerConfirmDelivery:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
