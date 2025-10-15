import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const models = initModels(sequelize);
const {
  donhang,
  chitiet_donhang,
  sanpham,
  giohang,
  ctgh,
  taikhoan,
  giaohang,
  thanhtoan,
  pttt,
  taikhoan_vaitro,
  vaitro
} = models;

/* ============================
 📂 1. Cấu hình upload ảnh proof giao hàng
============================ */
const uploadDir = "uploads/delivery";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ cho phép file JPG hoặc PNG"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).single("image");

/* ============================
 🚚 2. Admin gán Shipper cho đơn hàng
============================ */
export const assignDelivery = async (req, res) => {
  try {
    // 🛡️ Xác thực Admin
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
      return res.status(400).json({ message: "Thiếu MaDH hoặc MaTK (Shipper)" });
    }

    const order = await donhang.findByPk(MaDH);
    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }

    const shipperAcc = await taikhoan.findByPk(MaTK);
    if (!shipperAcc) {
      return res.status(404).json({ message: "Tài khoản Shipper không tồn tại" });
    }

    // Kiểm tra vai trò Shipper
    const shipperRole = await taikhoan_vaitro.findOne({
      where: { MaTK },
      include: [
        {
          model: vaitro,
          as: "vaitro",
          where: { TenVT: "Shipper" }
        }
      ]
    });

    if (!shipperRole) {
      return res.status(400).json({ message: "Tài khoản không phải Shipper" });
    }

    const MaGH = "GH" + uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();

    const record = await giaohang.create({
      MaGH,
      MaShipper: MaTK,
      MaDH,
      TrangThai: "ASSIGNED",
      GhiChu,
      NgayTao: new Date()
    });

    return res.json({
      success: true,
      message: "Gán Shipper thành công",
      data: record
    });

  } catch (err) {
    console.error("🔥 assignDelivery:", err);
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

/* ============================
 📸 3. Shipper upload ảnh proof giao hàng(đối với COD)
============================ */
// POST /api/delivery/:MaGH/proof (multipart/form-data)
export const shipperUploadProof = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: "Lỗi upload", error: err.message });
    }

    try {
      // Xác thực JWT và vai trò Shipper
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ message: "Không có token" });

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role !== "Shipper") return res.status(403).json({ message: "Chỉ Shipper mới upload proof" });

      const { MaGH } = req.params;
      const record = await giaohang.findByPk(MaGH);
      if (!record) return res.status(404).json({ message: "Không tìm thấy bản ghi giao hàng" });

      if (record.MaShipper !== decoded.MaTK) {
        return res.status(403).json({ message: "Bạn không được phân công giao đơn này" });
      }

      if (!req.file) return res.status(400).json({ message: "Thiếu file proof" });

      const filePath = `/uploads/delivery/${req.file.filename}`;
      record.ProofImage = filePath;
      record.TrangThai = "DELIVERED_BY_SHIPPER";
      await record.save();
      // ngày giờ: in giờ sai
      // Cập nhật trạng thái đơn hàng
      await donhang.update({ TrangThai: "Đã giao" }, { where: { MaDH: record.MaDH } });

      res.json({ success: true, message: "Upload proof thành công", data: record });

    } catch (error) {
      console.error("🔥 shipperUploadProof:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  });
};

/* ============================
 ✅ 4. Khách hàng xác nhận đã nhận hàng
    - Chỉ kích hoạt khi phương thức thanh toán là CHUYỂN KHOẢN NGÂN HÀNG
    - Nếu là COD → không dùng hàm này
============================ */
export const customerConfirmDelivery = async (req, res) => {
  try {
    // 🧠 1. Xác thực token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không có token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const MaTK = decoded.MaTK;

    // 📌 2. Lấy thông tin giao hàng + đơn hàng
    const { MaGH } = req.params;
    const record = await giaohang.findByPk(MaGH, {
      include: [{ model: donhang, as: "MaDH_donhang" }]
    });

    if (!record) return res.status(404).json({ message: "Không tìm thấy bản ghi giao hàng" });

    const order = record.MaDH_donhang;
    if (!order) return res.status(404).json({ message: "Đơn hàng liên quan không tồn tại" });

    if (order.MaTK !== MaTK) {
      return res.status(403).json({ message: "Bạn không phải chủ đơn này" });
    }

    // 📌 3. Kiểm tra phương thức thanh toán
    const ptttRecord = await pttt.findByPk(order.MaPTTT);
    if (!ptttRecord) {
      return res.status(400).json({ message: "Không tìm thấy phương thức thanh toán" });
    }

    const tenPTTT = ptttRecord.TenPTTT?.toLowerCase() || "";
    const isBankTransfer =  tenPTTT.includes("chuyển khoản ngân hàng"); //tenPTTT.includes("bank") ||

    if (!isBankTransfer) {
      return res.status(400).json({ 
        message: "Xác nhận chỉ áp dụng cho đơn thanh toán bằng chuyển khoản ngân hàng" 
      });
    }

    // 📌 4. Kiểm tra tình trạng giao hàng
    if (!record.ProofImage || record.TrangThai !== "DELIVERED_BY_SHIPPER") {
      return res.status(400).json({ message: "Chưa có bằng chứng giao hàng từ shipper" });
    }

    // 📌 5. Cập nhật trạng thái giao hàng & đơn hàng
    record.TrangThai = "RECEIVED_BY_CUSTOMER";
    await record.save();

    order.TrangThai = "Hoàn thành";
    await order.save();

    // 📌 6. Cập nhật trạng thái thanh toán (chuyển khoản)
    const tt = await thanhtoan.findOne({ where: { MaDH: order.MaDH } });
    if (tt) {
      tt.TrangThai = "Đã thanh toán";
      tt.NgayTao = new Date();
      tt.Thoigian = new Date().toLocaleTimeString("vi-VN", {
        hour12: false,
        timeZone: "Asia/Ho_Chi_Minh"
      });
      await tt.save();
    }

    res.json({ 
      success: true, 
      message: "Khách hàng đã xác nhận, đơn hoàn thành (chuyển khoản)", 
      data: record 
    });

  } catch (err) {
    console.error("🔥 customerConfirmDelivery:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
