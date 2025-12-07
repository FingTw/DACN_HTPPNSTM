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
  cuahang,
  giaodich_vi,
  thanhtoan,
  pttt,
  taikhoan_vaitro,
  vaitro,
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
  },
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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

    // Kiểm tra vai trò Shipper
    const shipperRole = await taikhoan_vaitro.findOne({
      where: { MaTK },
      include: [
        {
          model: vaitro,
          as: "vaitro",
          where: { TenVT: "Shipper" },
        },
      ],
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

export const shipperPickupOrder = async (req, res) => {
  try {
    const { MaDH } = req.body;
    const MaShipper = req.user.MaTK; // Lấy từ middleware auth

    const order = await donhang.findByPk(MaDH);
    if (!order)
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });

    // Kiểm tra xem đơn có đang ở trạng thái chờ lấy không
    if (order.TrangThai !== "Chờ lấy hàng") {
      return res
        .status(400)
        .json({ message: "Trạng thái đơn hàng không hợp lệ để lấy" });
    }

    // Cập nhật trạng thái
    order.TrangThai = "Đang giao"; // Chuẩn hóa trạng thái khi shipper đã lấy hàng
    await order.save();

    // Cập nhật bảng giaohang (Tracking)
    const shippingRecord = await giaohang.findOne({ where: { MaDH } });
    if (shippingRecord) {
      shippingRecord.TrangThai = "PICKED_UP";
      shippingRecord.ThoiGianLayHang = new Date();
      await shippingRecord.save();
    }

    res.json({ success: true, message: "Xác nhận lấy hàng thành công" });
  } catch (error) {
    console.error("Lỗi pickup:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/* ============================
🚚  Shipper tự nhận đơn (self-assign)
   POST /api/delivery/take  (body: { MaDH })
   - Nếu đã có bản ghi giaohang cho MaDH và chưa có MaShipper -> gán
   - Nếu chưa có -> tạo mới
   - Cập nhật trạng thái đơn hàng sang 'Đang giao'
============================ */
export const shipperTakeOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
      return res.status(401).json({ message: "Không có token" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const MaShipper = decoded.MaTK;
    if (!MaShipper) return res.status(401).json({ message: "Chưa xác thực" });

    const { MaDH } = req.body;
    if (!MaDH) return res.status(400).json({ message: "Thiếu MaDH" });

    const order = await donhang.findByPk(MaDH, { transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }

    let gh = await giaohang.findOne({ where: { MaDH }, transaction: t });
    if (gh) {
      if (gh.MaShipper) {
        await t.rollback();
        return res
          .status(400)
          .json({ message: "Đơn đã được nhận bởi shipper khác" });
      }
      gh.MaShipper = MaShipper;
      gh.TrangThai = "ASSIGNED";
      await gh.save({ transaction: t });
    } else {
      const MaGH =
        "GH" + uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();
      gh = await giaohang.create(
        {
          MaGH,
          MaShipper,
          MaDH,
          TrangThai: "ASSIGNED",
          NgayTao: new Date(),
        },
        { transaction: t }
      );
    }

    // Cập nhật trạng thái đơn
    await donhang.update(
      { TrangThai: "Đang giao" },
      { where: { MaDH }, transaction: t }
    );

    await t.commit();
    return res.json({
      success: true,
      message: "Bạn đã nhận đơn thành công",
      data: gh,
    });
  } catch (err) {
    await t.rollback();
    console.error("🔥 shipperTakeOrder:", err);
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
      return res
        .status(400)
        .json({ message: "Lỗi upload", error: err.message });
    }

    try {
      // Xác thực JWT và vai trò Shipper
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer "))
        return res.status(401).json({ message: "Không có token" });

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role !== "Shipper")
        return res
          .status(403)
          .json({ message: "Chỉ Shipper mới upload proof" });

      const { MaGH } = req.params;
      const record = await giaohang.findByPk(MaGH);
      if (!record)
        return res
          .status(404)
          .json({ message: "Không tìm thấy bản ghi giao hàng" });

      if (record.MaShipper !== decoded.MaTK) {
        return res
          .status(403)
          .json({ message: "Bạn không được phân công giao đơn này" });
      }

      if (!req.file)
        return res.status(400).json({ message: "Thiếu file proof" });

      const filePath = `/uploads/delivery/${req.file.filename}`;

      // Bắt đầu transaction để cập nhật trạng thái và tài chính
      const t = await sequelize.transaction();
      try {
        record.ProofImage = filePath;
        record.TrangThai = "DELIVERED_BY_SHIPPER";
        await record.save({ transaction: t });

        // Cập nhật trạng thái đơn hàng thành 'Hoàn tất' (hoàn thành giao nhận)
        await donhang.update(
          { TrangThai: "Hoàn tất" },
          { where: { MaDH: record.MaDH }, transaction: t }
        );

        // === PHẦN TÀI CHÍNH: Cộng tiền vào ví cửa hàng ===
        // Lấy chi tiết đơn hàng để biết số tiền theo từng cửa hàng
        const orderItems = await chitiet_donhang.findAll({
          where: { MaDH: record.MaDH },
          include: [
            {
              model: sanpham,
              as: "MaSP_sanpham",
              attributes: ["MaCH", "GiaBan"],
            },
          ],
          transaction: t,
        });

        const revenueByShop = {};
        for (const item of orderItems) {
          const maCH = item.MaSP_sanpham?.MaCH;
          const price = parseFloat(item.GiaBan || 0);
          const qty = parseFloat(item.SoLuong || 1);
          const amount = price * qty;
          if (!maCH) continue;
          revenueByShop[maCH] = (revenueByShop[maCH] || 0) + amount;
        }

        for (const [maCH, totalAmount] of Object.entries(revenueByShop)) {
          const shop = await cuahang.findByPk(maCH, { transaction: t });
          if (!shop) continue;

          const newBalance = parseFloat(shop.SoDu || 0) + Number(totalAmount);
          await cuahang.update(
            { SoDu: newBalance },
            { where: { MaCH: maCH }, transaction: t }
          );

          const MaGD =
            "GD" + uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();
          await giaodich_vi.create(
            {
              MaGD,
              MaCH: maCH,
              LoaiGD: "NHAN_TIEN_DON_HANG",
              SoTien: totalAmount,
              NoiDung: `Doanh thu từ đơn ${record.MaDH}`,
              TrangThai: "ThanhCong",
              NgayTao: new Date(),
            },
            { transaction: t }
          );
        }

        await t.commit();

        res.json({
          success: true,
          message:
            "Upload proof thành công, đơn hoàn tất và đã cộng tiền vào ví cửa hàng",
          data: record,
        });
      } catch (err2) {
        await t.rollback();
        console.error("🔥 shipperUploadProof (tx):", err2);
        return res
          .status(500)
          .json({
            message: "Lỗi khi cập nhật trạng thái/tài chính",
            error: err2.message,
          });
      }
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

    if (order.MaTK !== MaTK) {
      return res.status(403).json({ message: "Bạn không phải chủ đơn này" });
    }

    // 📌 3. Kiểm tra phương thức thanh toán
    const ptttRecord = await pttt.findByPk(order.MaPTTT);
    if (!ptttRecord) {
      return res
        .status(400)
        .json({ message: "Không tìm thấy phương thức thanh toán" });
    }

    const tenPTTT = ptttRecord.TenPTTT?.toLowerCase() || "";
    const isBankTransfer = tenPTTT.includes("chuyển khoản ngân hàng"); //tenPTTT.includes("bank") ||

    if (!isBankTransfer) {
      return res.status(400).json({
        message:
          "Xác nhận chỉ áp dụng cho đơn thanh toán bằng chuyển khoản ngân hàng",
      });
    }

    // 📌 4. Kiểm tra tình trạng giao hàng
    if (!record.ProofImage || record.TrangThai !== "DELIVERED_BY_SHIPPER") {
      return res
        .status(400)
        .json({ message: "Chưa có bằng chứng giao hàng từ shipper" });
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
        timeZone: "Asia/Ho_Chi_Minh",
      });
      await tt.save();
    }

    res.json({
      success: true,
      message: "Khách hàng đã xác nhận, đơn hoàn thành (chuyển khoản)",
      data: record,
    });
  } catch (err) {
    console.error("🔥 customerConfirmDelivery:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
