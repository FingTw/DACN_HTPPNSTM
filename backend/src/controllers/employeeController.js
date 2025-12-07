import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import { Op } from "sequelize";
import { authenticateToken } from "./cuahangController.js";

const models = initModels(sequelize);
const {
  giaohang,
  donhang,
  taikhoan,
  xuatnhapton,
  xuatnhapton_sanpham,
  nhanvien,
} = models;

const generateMa = (prefix = "GH") => {
  const now = new Date();
  return (
    prefix +
    now.getFullYear().toString().slice(2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    Date.now().toString().slice(-6)
  );
};

const employeeController = {
  // Lấy danh sách giao hàng: nếu ?available=true => các đơn chưa có MaShipper (chưa assign)
  getDeliveries: async (req, res) => {
    try {
      const { available } = req.query;
      if (available === "true") {
        const rows = await giaohang.findAll({ where: { MaShipper: null } });
        return res.json({ success: true, data: rows });
      }

      // nếu có token, trả về deliverires của shipper
      const shipperId = req.user?.MaTK;
      if (!shipperId)
        return res
          .status(401)
          .json({ success: false, message: "Chưa xác thực" });

      const rows = await giaohang.findAll({ where: { MaShipper: shipperId } });
      res.json({ success: true, data: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Tạo/Gán giao hàng cho đơn (shipper nhận đơn)
  takeDelivery: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const shipperId = req.user?.MaTK;
      const { MaDH } = req.body;
      if (!shipperId)
        return res
          .status(401)
          .json({ success: false, message: "Chưa xác thực" });
      if (!MaDH)
        return res.status(400).json({ success: false, message: "Thiếu MaDH" });

      // Kiểm tra đơn hàng tồn tại
      const order = await donhang.findByPk(MaDH, { transaction: t });
      if (!order) {
        await t.rollback();
        return res
          .status(404)
          .json({ success: false, message: "Đơn hàng không tồn tại" });
      }

      // Tạo bản ghi giaohang
      const MaGH = generateMa("GH");
      const newGH = await giaohang.create(
        {
          MaGH,
          MaShipper: shipperId,
          MaDH,
          TrangThai: "ASSIGNED",
          NgayTao: new Date(),
        },
        { transaction: t }
      );

      // Cập nhật trạng thái đơn nếu cần (ví dụ: 'Đang giao')
      await donhang.update(
        { TrangThai: "Đang giao" },
        { where: { MaDH }, transaction: t }
      );

      await t.commit();
      res.json({ success: true, data: newGH });
    } catch (err) {
      await t.rollback();
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Cập nhật trạng thái giao hàng, có thể kèm file ảnh proof (sử dụng multer ở route)
  updateDeliveryStatus: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { MaGH } = req.params;
      const { TrangThai, GhiChu } = req.body;
      const file = req.file; // multer

      const gh = await giaohang.findByPk(MaGH, { transaction: t });
      if (!gh) {
        await t.rollback();
        return res
          .status(404)
          .json({ success: false, message: "Giao hàng không tồn tại" });
      }

      const updateData = {};
      if (TrangThai) updateData.TrangThai = TrangThai;
      if (GhiChu) updateData.GhiChu = GhiChu;
      if (file && file.path) {
        // Lưu đường dẫn relative
        const rel = file.path.split("public")[1] || file.path;
        updateData.ProofImage = rel.replace(/\\/g, "/");
      }

      await giaohang.update(updateData, { where: { MaGH }, transaction: t });

      // Nếu delivered -> cập nhật đơn hàng trạng thái 'Hoàn thành'
      if (TrangThai && /delivered|hoàn thành|completed/i.test(TrangThai)) {
        const ghRec = await giaohang.findByPk(MaGH, { transaction: t });
        if (ghRec && ghRec.MaDH) {
          await donhang.update(
            { TrangThai: "Hoàn thành" },
            { where: { MaDH: ghRec.MaDH }, transaction: t }
          );
        }
      }

      await t.commit();
      res.json({ success: true, message: "Cập nhật giao hàng thành công" });
    } catch (err) {
      await t.rollback();
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // ================= Warehouse ====================
  // Tạo phiếu nhập/xuất (xuatnhapton) và trả về MaXNT
  createXNT: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const userId = req.user?.MaTK;
      const { LoaiXNT, MaKho, GhiChu, items = [] } = req.body; // items: [{ MaSP, SoLuong }]
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "Chưa xác thực" });
      if (!LoaiXNT || !MaKho)
        return res
          .status(400)
          .json({ success: false, message: "Thiếu thông tin" });

      const now = new Date();
      const prefix = LoaiXNT === "IMPORT" ? "PX" : "PO"; // PX = phiếu nhập, PO = phiếu xuất
      const MaXNT =
        prefix +
        now.getFullYear().toString().slice(2) +
        Date.now().toString().slice(-6);

      await xuatnhapton.create(
        { MaXNT, LoaiXNT, NgayLap: now, GhiChu, MaKho, MaNV: userId },
        { transaction: t }
      );

      // Nếu có items, tạo xuatnhapton_sanpham records
      if (Array.isArray(items) && items.length > 0) {
        const spData = items.map((it) => ({
          MaXNT,
          MaSP: it.MaSP,
          SoLuong: it.SoLuong,
        }));
        await xuatnhapton_sanpham.bulkCreate(spData, { transaction: t });
      }

      await t.commit();
      res.json({ success: true, data: { MaXNT } });
    } catch (err) {
      await t.rollback();
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

export default employeeController;
