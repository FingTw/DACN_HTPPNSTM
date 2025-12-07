// src/controllers/warehouseController.js
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

const models = initModels(sequelize);
const {
  kho,
  xuatnhapton,
  xuatnhapton_sanpham,
  sanpham,
  donhang,
  chitiet_donhang,
} = models;

export const warehouseController = {
  // 1. Nhập kho (Hàng từ Shop về Kho hoặc từ Kho khác đến)
  importToWarehouse: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { MaKho, MaDH, GhiChu } = req.body;
      const MaNV = req.user.MaTK; // Lấy từ token (Nhân viên kho/Shipper)

      // Kiểm tra đơn hàng
      const order = await donhang.findByPk(MaDH, {
        include: [{ model: chitiet_donhang, as: "chitiet_donhangs" }],
      });

      if (!order) {
        await transaction.rollback();
        return res.status(404).json({ message: "Đơn hàng không tồn tại" });
      }

      // Tạo phiếu nhập
      const MaXNT = "IMP" + uuidv4().substring(0, 8).toUpperCase();
      const phieuNhap = await xuatnhapton.create(
        {
          MaXNT,
          MaKho,
          MaNV,
          LoaiPhieu: "NHAP", // Nhập kho
          NgayTao: new Date(),
          GhiChu: GhiChu || `Nhập đơn hàng ${MaDH} vào kho`,
        },
        { transaction }
      );

      // Lưu chi tiết sản phẩm nhập
      for (const item of order.chitiet_donhangs) {
        await xuatnhapton_sanpham.create(
          {
            MaXNT,
            MaSP: item.MaSP,
            SoLuong: item.SoLuong,
            Gia: item.GiaBan,
          },
          { transaction }
        );
      }

      // Cập nhật trạng thái đơn hàng
      order.TrangThai = "Đã nhập kho";
      await order.save({ transaction });

      await transaction.commit();
      res.json({
        success: true,
        message: "Nhập kho thành công",
        data: phieuNhap,
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Lỗi nhập kho:", error);
      res.status(500).json({ message: "Lỗi nhập kho" });
    }
  },

  // 2. Xuất kho (Giao cho Shipper đi phát)
  exportFromWarehouse: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { MaKho, MaDH, MaShipper, GhiChu } = req.body;
      const MaNV = req.user.MaTK;

      const order = await donhang.findByPk(MaDH, {
        include: [{ model: chitiet_donhang, as: "chitiet_donhangs" }],
      });

      if (!order) {
        await transaction.rollback();
        return res.status(404).json({ message: "Đơn hàng không tồn tại" });
      }

      // Tạo phiếu xuất
      const MaXNT = "EXP" + uuidv4().substring(0, 8).toUpperCase();
      await xuatnhapton.create(
        {
          MaXNT,
          MaKho,
          MaNV,
          LoaiPhieu: "XUAT", // Xuất kho
          NgayTao: new Date(),
          GhiChu: GhiChu || `Xuất đơn ${MaDH} cho Shipper ${MaShipper}`,
        },
        { transaction }
      );

      // Lưu chi tiết xuất
      for (const item of order.chitiet_donhangs) {
        await xuatnhapton_sanpham.create(
          {
            MaXNT,
            MaSP: item.MaSP,
            SoLuong: item.SoLuong,
            Gia: item.GiaBan,
          },
          { transaction }
        );
      }

      // Cập nhật trạng thái đơn hàng -> Đang giao hàng
      order.TrangThai = "Đang giao hàng";
      await order.save({ transaction });

      await transaction.commit();
      res.json({
        success: true,
        message: "Xuất kho thành công, đã giao Shipper",
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Lỗi xuất kho:", error);
      res.status(500).json({ message: "Lỗi xuất kho" });
    }
  },
};
