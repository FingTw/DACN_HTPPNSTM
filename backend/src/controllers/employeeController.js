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
  cuahang,
  chitiet_donhang,
  sanpham,
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
  getDeliveries: async (req, res) => {
    try {
      const shipperId = req.user?.MaTK;
      const { type } = req.query;
      let tasks = [];

      if (type === "pickup") {
        // Copy lại logic pickup từ câu trả lời trước
        const orders = await donhang.findAll({
          where: {
            [Op.or]: [
              { TrangThai: "Chờ lấy hàng" },
              { TrangThai: "Đang đi lấy" },
            ],
          },
          include: [
            { model: giaohang, as: "giaohangs", required: false },
            {
              model: chitiet_donhang,
              as: "chitiet_donhangs",
              include: [
                {
                  model: sanpham,
                  as: "MaSP_sanpham",
                  include: [{ model: cuahang, as: "cuahang" }],
                },
              ],
            },
          ],
          order: [["NgayTao", "DESC"]],
        });
        // Filter logic...
        const filteredOrders = orders.filter((order) => {
          const gh = order.giaohangs?.[0];
          if (order.TrangThai === "Chờ lấy hàng") return !gh || !gh.MaShipper;
          if (order.TrangThai === "Đang đi lấy")
            return gh && gh.MaShipper === shipperId;
          return false;
        });
        tasks = filteredOrders.map((o) => ({
          /* map data */ MaGH: null,
          MaDH: o.MaDH,
          LoaiNhiemVu: "LẤY HÀNG",
          ShopName: o.chitiet_donhangs?.[0]?.MaSP_sanpham?.cuahang?.TenCH,
          ShopAddress: o.chitiet_donhangs?.[0]?.MaSP_sanpham?.cuahang?.DiaChi,
          CustomerName: "Khách hàng",
          CustomerAddress: o.DCNhanHang,
          CodAmount: o.TongTien,
          TrangThaiDon: o.TrangThai,
          TrangThaiGiao: "ASSIGNED",
          NgayTao: o.NgayTao,
        }));
      }
      // TAB GIAO HÀNG (SỬA LẠI CHO CHẮC CHẮN)
      else {
        let whereCondition = {};

        if (type === "delivery") {
          // Lấy đơn của tôi HOẶC đơn tự do (MaShipper: null)
          // Đơn tự do xuất hiện khi Kho bấm Xuất kho
          whereCondition = {
            [Op.or]: [
              {
                MaShipper: shipperId,
                TrangThai: { [Op.ne]: "DELIVERED_BY_SHIPPER" },
              },
              { MaShipper: null }, // <--- Đảm bảo có dòng này
            ],
          };
        } else if (type === "history") {
          whereCondition = {
            MaShipper: shipperId,
            TrangThai: { [Op.or]: ["DELIVERED_BY_SHIPPER", "PICKED_UP"] },
          };
        }

        const rawTasks = await giaohang.findAll({
          where: whereCondition,
          include: [
            {
              model: donhang,
              as: "MaDH_donhang",
              where: { TrangThai: "Đang giao hàng" }, // Chỉ lấy đơn đang đi giao
              required: true,
              include: [
                {
                  model: chitiet_donhang,
                  as: "chitiet_donhangs",
                  include: [
                    {
                      model: sanpham,
                      as: "MaSP_sanpham",
                      include: [{ model: cuahang, as: "cuahang" }],
                    },
                  ],
                },
              ],
            },
          ],
          order: [["NgayTao", "DESC"]], // Đơn mới xuất hiện lên đầu
        });

        tasks = rawTasks.map((t) => {
          const order = t.MaDH_donhang;
          const shopInfo = order.chitiet_donhangs?.[0]?.MaSP_sanpham?.cuahang;
          return {
            MaGH: t.MaGH,
            MaDH: t.MaDH,
            LoaiNhiemVu: type === "delivery" ? "GIAO HÀNG" : "LỊCH SỬ",
            ShopName: shopInfo?.TenCH || "Cửa hàng",
            ShopAddress: shopInfo?.DiaChi || "Địa chỉ shop",
            CustomerName: "Khách hàng",
            CustomerAddress: order.DCNhanHang,
            CodAmount: order.TongTien,
            TrangThaiDon: order.TrangThai,
            TrangThaiGiao: t.TrangThai,
            NgayTao: t.NgayTao,
          };
        });
      }

      res.json({ success: true, data: tasks });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

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

      // Chỉ cho phép nhận các đơn đang ở trạng thái "Chờ lấy hàng"
      if (order.TrangThai !== "Chờ lấy hàng") {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Đơn không ở trạng thái Chờ lấy hàng",
        });
      }

      // Nếu đã có bản ghi giao hàng thì gán shipper, tránh tạo trùng
      let gh = await giaohang.findOne({ where: { MaDH }, transaction: t });
      if (gh) {
        if (gh.MaShipper && gh.MaShipper !== shipperId) {
          await t.rollback();
          return res.status(400).json({
            success: false,
            message: "Đơn đã được nhận bởi shipper khác",
          });
        }
        await gh.update(
          {
            MaShipper: shipperId,
            TrangThai: "ASSIGNED",
          },
          { transaction: t }
        );
      } else {
        const MaGH = generateMa("GH");
        gh = await giaohang.create(
          {
            MaGH,
            MaShipper: shipperId,
            MaDH,
            TrangThai: "ASSIGNED",
            NgayTao: new Date(),
          },
          { transaction: t }
        );
      }

      // Cập nhật trạng thái đơn sang Chờ giao hàng
      await donhang.update(
        { TrangThai: "Chờ giao hàng" },
        { where: { MaDH }, transaction: t }
      );

      await t.commit();
      res.json({ success: true, data: gh });
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
      const shipperId = req.user?.MaTK;
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

      if (gh.MaShipper && shipperId && gh.MaShipper !== shipperId) {
        await t.rollback();
        return res.status(403).json({
          success: false,
          message: "Bạn không được cập nhật giao hàng này",
        });
      }

      const updateData = {};
      const nextStatus = TrangThai || "Đã giao";
      updateData.TrangThai = nextStatus;
      if (GhiChu) updateData.GhiChu = GhiChu;
      if (file && file.path) {
        // Lưu đường dẫn relative
        const rel = file.path.split("public")[1] || file.path;
        const normalized = rel.replace(/\\/g, "/");
        updateData.ProofImage = normalized.startsWith("/")
          ? normalized
          : `/${normalized}`;
      }

      await giaohang.update(updateData, { where: { MaGH }, transaction: t });

      // Nếu đã giao → cập nhật đơn hàng sang "Đã giao" để chờ khách xác nhận
      if (/đã giao|delivered|completed/i.test(nextStatus)) {
        const ghRec = await giaohang.findByPk(MaGH, { transaction: t });
        if (ghRec && ghRec.MaDH) {
          await donhang.update(
            { TrangThai: "Đã giao" },
            { where: { MaDH: ghRec.MaDH }, transaction: t }
          );
        }
      }

      await t.commit();
      res.json({
        success: true,
        message: "Cập nhật giao hàng thành công",
        data: { MaGH, TrangThai: nextStatus },
      });
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
      const prefix = LoaiXNT === "IMPORT" ? "PX" : "PO";
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
