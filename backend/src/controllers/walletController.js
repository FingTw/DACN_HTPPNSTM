import { v4 as uuidv4 } from "uuid";
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import jwt from "jsonwebtoken";

const models = initModels(sequelize);
const { cuahang, giaodich_vi } = models;

export const walletController = {
  // 1. Lấy thông tin ví và lịch sử giao dịch
  getWalletInfo: async (req, res) => {
    try {
      const { MaCH } = req.params;

      if (store.MaTK !== user.MaTK) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền chỉnh sửa cửa hàng này",
        });
      }

      const store = await cuahang.findByPk(MaCH, {
        attributes: ["MaCH", "TenCH", "SoDu"],
      });

      if (!store)
        return res.status(404).json({ message: "Cửa hàng không tồn tại" });

      const transactions = await giaodich_vi.findAll({
        where: { MaCH },
        order: [["NgayTao", "DESC"]],
      });

      return res.json({
        success: true,
        data: {
          balance: store.SoDu,
          transactions: transactions,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi lấy thông tin ví" });
    }
  },

  // 2. Tạo yêu cầu rút tiền
  requestWithdraw: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { MaCH, SoTien, TenNganHang, SoTaiKhoan } = req.body;

      if (SoTien < 50000) {
        return res
          .status(400)
          .json({ message: "Số tiền rút tối thiểu là 50.000đ" });
      }

      const store = await cuahang.findByPk(MaCH, { transaction });

      if (parseFloat(store.SoDu) < parseFloat(SoTien)) {
        await transaction.rollback();
        return res.status(400).json({ message: "Số dư không đủ" });
      }

      // Trừ tiền ngay lập tức
      await cuahang.update(
        {
          SoDu: parseFloat(store.SoDu) - parseFloat(SoTien),
        },
        { where: { MaCH }, transaction }
      );

      // Tạo giao dịch rút tiền (Trạng thái: DangXuLy)
      const MaGD =
        "RT" + uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();

      await giaodich_vi.create(
        {
          MaGD,
          MaCH,
          LoaiGD: "RUT_TIEN",
          SoTien: parseFloat(SoTien), // Lưu số dương để hiển thị là rút bao nhiêu
          TenNganHang,
          SoTaiKhoan,
          NoiDung: `Yêu cầu rút tiền về ${TenNganHang} - ${SoTaiKhoan}`,
          TrangThai: "DangXuLy",
          NgayTao: new Date(),
        },
        { transaction }
      );

      await transaction.commit();
      res.json({ success: true, message: "Đã gửi yêu cầu rút tiền" });
    } catch (err) {
      await transaction.rollback();
      console.error(err);
      res.status(500).json({ message: "Lỗi xử lý rút tiền" });
    }
  },

  adminHandleWithdraw: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      // Action: 'APPROVE' (Duyệt) hoặc 'REJECT' (Từ chối)
      const { MaGD, Action, GhiChuAdmin } = req.body;

      const gd = await giaodich_vi.findOne({
        where: { MaGD },
        transaction,
      });

      if (!gd) {
        await transaction.rollback();
        return res.status(404).json({ message: "Giao dịch không tồn tại" });
      }

      if (gd.TrangThai !== "DangXuLy") {
        await transaction.rollback();
        return res
          .status(400)
          .json({ message: "Giao dịch này đã được xử lý trước đó" });
      }

      if (Action === "APPROVE") {
        // === DUYỆT ===
        await giaodich_vi.update(
          {
            TrangThai: "ThanhCong",
            NoiDung:
              gd.NoiDung + (GhiChuAdmin ? ` | Admin note: ${GhiChuAdmin}` : ""),
          },
          {
            where: { MaGD },
            transaction,
          }
        );

        await transaction.commit();
        return res.json({
          success: true,
          message: "Đã xác nhận rút tiền thành công.",
        });
      } else if (Action === "REJECT") {
        // === TỪ CHỐI (HOÀN TIỀN) ===
        // 1. Cập nhật trạng thái từ chối
        await giaodich_vi.update(
          {
            TrangThai: "TuChoi",
            NoiDung:
              gd.NoiDung + (GhiChuAdmin ? ` | Lý do hủy: ${GhiChuAdmin}` : ""),
          },
          {
            where: { MaGD },
            transaction,
          }
        );

        // 2. Cộng lại tiền vào ví cửa hàng
        const store = await cuahang.findByPk(gd.MaCH, { transaction });

        await cuahang.update(
          {
            SoDu: parseFloat(store.SoDu) + parseFloat(gd.SoTien),
          },
          {
            where: { MaCH: gd.MaCH },
            transaction,
          }
        );

        await transaction.commit();
        return res.json({
          success: true,
          message: "Đã từ chối và hoàn tiền lại ví.",
        });
      } else {
        await transaction.rollback();
        return res.status(400).json({ message: "Hành động không hợp lệ" });
      }
    } catch (err) {
      await transaction.rollback();
      console.error(err);
      return res.status(500).json({ message: "Lỗi xử lý giao dịch" });
    }
  },
};
