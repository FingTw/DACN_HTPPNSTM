// src/controllers/warehouseController.js
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";

const models = initModels(sequelize);
const {
  xuatnhapton,
  xuatnhapton_sanpham,
  donhang,
  chitiet_donhang,
  lichsu_trangthai,
  kho,
  cuahang,
  sanpham,
  giaohang,
} = models;

export const warehouseController = {
  // ... (Hàm getAllWarehouses giữ nguyên)
  getAllWarehouses: async (req, res) => {
    try {
      const warehouses = await kho.findAll();
      res.json(warehouses);
    } catch (error) {
      res.status(500).json({ message: "Lỗi lấy danh sách kho" });
    }
  },

  getWarehouseOrders: async (req, res) => {
    try {
      const { type, MaKho } = req.query; // type: 'INCOMING' | 'IN_STOCK'

      // 1. Lấy tất cả đơn hàng có liên quan (Trạng thái vận chuyển)
      const orders = await donhang.findAll({
        where: {
          TrangThai: {
            [Op.in]: [
              "Chờ lấy hàng",
              "Đang đi lấy",
              "Đang giao hàng",
              "Đã nhập kho",
            ],
          },
        },
        include: [
          {
            model: xuatnhapton,
            as: "xuatnhaptons",
            attributes: ["MaKho", "LoaiXNT", "NgayLap", "MaXNT"], // Lấy thêm MaXNT để sort phụ
            separate: true, // Lấy toàn bộ lịch sử ra để JS xử lý
          },
          {
            model: chitiet_donhang,
            as: "chitiet_donhangs",
            include: [
              { model: sanpham, as: "MaSP_sanpham", attributes: ["TenSP"] },
            ],
          },
        ],
        order: [["NgayTao", "ASC"]],
      });

      // 2. Lọc bằng Javascript để đảm bảo logic đúng 100%
      const filteredOrders = orders.filter((order) => {
        // Sort lịch sử: Mới nhất lên đầu (Dựa vào NgayLap và MaXNT để tránh trùng giờ)
        const logs = order.xuatnhaptons || [];
        logs.sort((a, b) => {
          const timeA = new Date(a.NgayLap).getTime();
          const timeB = new Date(b.NgayLap).getTime();
          if (timeA !== timeB) return timeB - timeA; // Mới hơn đứng trước
          return b.MaXNT.localeCompare(a.MaXNT); // Nếu trùng giờ, lấy ID lớn hơn (tạo sau)
        });

        const lastLog = logs[0]; // Hành động cuối cùng

        // 🟢 LOGIC HÀNG TRONG KHO (IN_STOCK)
        if (type === "IN_STOCK") {
          if (!lastLog) return false; // Chưa có lịch sử -> Không ở trong kho
          if (lastLog.LoaiXNT === "EXPORT") return false; // Vừa xuất kho -> KHÔNG HIỆN
          if (lastLog.LoaiXNT === "IMPORT" && lastLog.MaKho === MaKho)
            return true; // Đang ở kho này -> HIỆN

          return false;
        }

        // 🟡 LOGIC ĐƠN CHỜ NHẬP (INCOMING)
        else if (type === "INCOMING") {
          // Case 1: Đơn mới tinh (Chưa có log) -> Hiện
          if (!lastLog) return true;

          // Case 2: Đơn vừa Xuất khỏi kho KHÁC -> Hiện để nhập
          if (lastLog.LoaiXNT === "EXPORT" && lastLog.MaKho !== MaKho)
            return true;

          // Case 3: Đơn vừa Xuất khỏi kho MÌNH -> Ẩn (Vừa xuất đi rồi nhập lại làm gì)
          if (lastLog.LoaiXNT === "EXPORT" && lastLog.MaKho === MaKho)
            return false;

          // Case 4: Đang nằm trong kho (bất kỳ kho nào) -> Ẩn
          if (lastLog.LoaiXNT === "IMPORT") return false;

          return false;
        }
        return false;
      });

      res.json(filteredOrders);
    } catch (error) {
      console.error("Lỗi lấy danh sách đơn kho:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  // ... (Hàm importOrderToWarehouse GIỮ NGUYÊN logic đã sửa ở bước trước - có tạo chitiet)
  importOrderToWarehouse: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { MaKho, MaDH, GhiChu } = req.body;
      const MaNV = req.user.MaTK;

      const order = await donhang.findByPk(MaDH, { transaction });
      if (!order) {
        await transaction.rollback();
        return res.status(404).json({ message: "Đơn hàng không tồn tại" });
      }

      // Kiểm tra đơn đã ở trong kho này chưa (tránh nhập đúp)
      const lastEntry = await xuatnhapton.findOne({
        where: { MaDH },
        order: [["NgayLap", "DESC"]],
        transaction,
      });
      if (
        lastEntry &&
        lastEntry.LoaiXNT === "IMPORT" &&
        lastEntry.MaKho === MaKho
      ) {
        await transaction.rollback();
        return res
          .status(400)
          .json({ message: "Đơn hàng này đã nằm trong kho rồi!" });
      }

      const MaXNT = "PN" + uuidv4().substring(0, 8).toUpperCase();

      // Tạo phiếu nhập
      await xuatnhapton.create(
        {
          MaXNT,
          LoaiXNT: "IMPORT",
          MaDH,
          MaKho,
          MaNV,
          NgayLap: new Date(),
          GhiChu,
        },
        { transaction }
      );

      // Copy chi tiết
      const orderDetails = await chitiet_donhang.findAll({
        where: { MaDH },
        transaction,
      });
      if (orderDetails.length > 0) {
        const items = orderDetails.map((item) => ({
          MaXNT,
          MaSP: item.MaSP,
          SoLuong: item.SoLuong,
        }));
        await xuatnhapton_sanpham.bulkCreate(items, { transaction });
      }

      // Tracking
      await lichsu_trangthai.create(
        {
          MaLS: "LS" + uuidv4().substring(0, 8).toUpperCase(),
          MaDH,
          TrangThaiCu: order.TrangThai,
          TrangThaiMoi: "Đang giao hàng", // Luôn quy về trạng thái chuẩn
          NgayCapNhat: new Date(),
          NguoiCapNhat: MaNV,
          GhiChu: `Đã nhập kho ${MaKho}`,
        },
        { transaction }
      );

      // Đảm bảo trạng thái đơn là Đang giao hàng
      if (order.TrangThai !== "Đang giao hàng") {
        order.TrangThai = "Đang giao hàng";
        await order.save({ transaction });
      }

      await transaction.commit();
      res.json({ success: true, message: "Nhập kho thành công" });
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ message: "Lỗi nhập kho: " + error.message });
    }
  },

  exportOrderFromWarehouse: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { MaKho, MaDH, GhiChu } = req.body;
      const MaNV = req.user.MaTK;

      // 1. Check xem có hàng để xuất không
      // (Dùng sort DESC NgayLap để lấy trạng thái mới nhất)
      const lastEntry = await xuatnhapton.findOne({
        where: { MaDH },
        order: [
          ["NgayLap", "DESC"],
          ["MaXNT", "DESC"],
        ], // Sort kỹ
        transaction,
      });

      if (
        !lastEntry ||
        lastEntry.LoaiXNT !== "IMPORT" ||
        lastEntry.MaKho !== MaKho
      ) {
        await transaction.rollback();
        return res
          .status(400)
          .json({
            message: "Đơn hàng không có trong kho này (hoặc đã xuất rồi)!",
          });
      }

      // 2. Tạo phiếu xuất
      const MaXNT = "PX" + uuidv4().substring(0, 8).toUpperCase();
      await xuatnhapton.create(
        {
          MaXNT,
          LoaiXNT: "EXPORT",
          MaDH,
          MaKho,
          MaNV,
          NgayLap: new Date(),
          GhiChu,
        },
        { transaction }
      );

      // Copy chi tiết
      const orderDetails = await chitiet_donhang.findAll({
        where: { MaDH },
        transaction,
      });
      if (orderDetails.length > 0) {
        const items = orderDetails.map((item) => ({
          MaXNT,
          MaSP: item.MaSP,
          SoLuong: item.SoLuong,
        }));
        await xuatnhapton_sanpham.bulkCreate(items, { transaction });
      }

      // 3. ⚠️ QUAN TRỌNG: RESET GIAOHANG ĐỂ SHIPPER THẤY
      // Set MaShipper = null để nó rơi vào nhóm "Đơn tự do"
      await giaohang.update(
        {
          MaShipper: null,
          TrangThai: "ASSIGNED", // Reset về trạng thái chờ
          GhiChu: `Xuất kho ${MaKho} - Chờ shipper nhận`,
        },
        { where: { MaDH }, transaction }
      );

      // 4. Tracking
      await lichsu_trangthai.create(
        {
          MaLS: "LS" + uuidv4().substring(0, 8).toUpperCase(),
          MaDH,
          TrangThaiCu: "Đang giao hàng",
          TrangThaiMoi: "Đang giao hàng",
          NgayCapNhat: new Date(),
          NguoiCapNhat: MaNV,
          GhiChu: `Xuất kho ${MaKho} - Sẵn sàng giao đi`,
        },
        { transaction }
      );

      await transaction.commit();
      res.json({ success: true, message: "Xuất kho thành công" });
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ message: "Lỗi xuất kho: " + error.message });
    }
  },
};
