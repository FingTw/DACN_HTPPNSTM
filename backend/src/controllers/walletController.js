import { v4 as uuidv4 } from "uuid";
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";

const models = initModels(sequelize);
const { cuahang, giaodich_vi, taikhoan } = models;

export const walletController = {
  // 1. Lấy thông tin ví và lịch sử giao dịch
  getWalletInfo: async (req, res) => {
    try {
      const { MaCH } = req.params;
      const user = req.user; // Lấy từ middleware authenticateToken

      // 👇 SỬA LỖI Ở ĐÂY: Phải tìm cửa hàng trước rồi mới check quyền
      const store = await cuahang.findByPk(MaCH, {
        attributes: ["MaCH", "TenCH", "SoDu", "MaTK"], // Lấy thêm MaTK để check
      });

      if (!store) {
        return res.status(404).json({ message: "Cửa hàng không tồn tại" });
      }

      // Check quyền sở hữu
      if (store.MaTK !== user.MaTK) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xem ví của cửa hàng này",
        });
      }

      // Lấy lịch sử (bao gồm cả Rút tiền và Nhận tiền đơn hàng)
      const transactions = await giaodich_vi.findAll({
        where: { MaCH },
        order: [["NgayTao", "DESC"]],
      });

      return res.json({
        success: true,
        data: {
          balance: store.SoDu, // Lấy trực tiếp từ bảng cuahang
          transactions: transactions,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi lấy thông tin ví" });
    }
  },

  // ... (Giữ nguyên các hàm requestWithdraw và adminHandleWithdraw)
  requestWithdraw: async (req, res) => {
    // ... code cũ giữ nguyên
    const transaction = await sequelize.transaction();
    try {
      const { MaCH, SoTien, TenNganHang, SoTaiKhoan } = req.body;

      if (SoTien < 50000) {
        return res
          .status(400)
          .json({ message: "Số tiền rút tối thiểu là 50.000đ" });
      }

      const store = await cuahang.findByPk(MaCH, { transaction });

      // Parse float để so sánh số
      if (parseFloat(store.SoDu) < parseFloat(SoTien)) {
        await transaction.rollback();
        return res.status(400).json({ message: "Số dư không đủ" });
      }

      // Trừ tiền ngay lập tức trong bảng cuahang
      await cuahang.update(
        {
          SoDu: parseFloat(store.SoDu) - parseFloat(SoTien),
        },
        { where: { MaCH }, transaction }
      );

      // Tạo giao dịch rút tiền
      const MaGD =
        "RT" + uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();

      await giaodich_vi.create(
        {
          MaGD,
          MaCH,
          LoaiGD: "RUT_TIEN",
          SoTien: parseFloat(SoTien),
          TenNganHang,
          SoTaiKhoan,
          NoiDung: `Rút tiền về ${TenNganHang} - ${SoTaiKhoan}`,
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

  // ... adminHandleWithdraw giữ nguyên
  adminHandleWithdraw: async (req, res) => {
    // ... code cũ giữ nguyên
    const transaction = await sequelize.transaction();
    try {
      const { MaGD, Action, GhiChuAdmin } = req.body;
      const gd = await giaodich_vi.findOne({ where: { MaGD }, transaction });

      if (!gd) {
        await transaction.rollback();
        return res.status(404).json({ message: "Giao dịch không tồn tại" });
      }

      if (gd.TrangThai !== "DangXuLy") {
        await transaction.rollback();
        return res.status(400).json({ message: "Giao dịch đã được xử lý" });
      }

      if (Action === "APPROVE") {
        await giaodich_vi.update(
          {
            TrangThai: "ThanhCong",
            NoiDung:
              gd.NoiDung + (GhiChuAdmin ? ` | Note: ${GhiChuAdmin}` : ""),
          },
          { where: { MaGD }, transaction }
        );
        await transaction.commit();
        return res.json({ success: true, message: "Đã duyệt rút tiền" });
      } else if (Action === "REJECT") {
        // Hoàn tiền lại ví
        await giaodich_vi.update(
          {
            TrangThai: "TuChoi",
            NoiDung: gd.NoiDung + (GhiChuAdmin ? ` | Hủy: ${GhiChuAdmin}` : ""),
          },
          { where: { MaGD }, transaction }
        );

        const store = await cuahang.findByPk(gd.MaCH, { transaction });
        await cuahang.update(
          { SoDu: parseFloat(store.SoDu) + parseFloat(gd.SoTien) },
          { where: { MaCH: gd.MaCH }, transaction }
        );

        await transaction.commit();
        return res.json({ success: true, message: "Đã từ chối và hoàn tiền" });
      }
    } catch (err) {
      await transaction.rollback();
      res.status(500).json({ message: "Lỗi xử lý giao dịch" });
    }
  },

  getAllWithdrawals: async (req, res) => {
    try {
      const { status } = req.query;

      const whereCondition = {};
      if (status) {
        whereCondition.TrangThai = status;
      }
      whereCondition.LoaiGD = "RUT_TIEN";

      const list = await giaodich_vi.findAll({
        where: whereCondition,
        include: [
          {
            model: cuahang,
            as: "MaCH_cuahang",
            attributes: ["TenCH", "MaCH"],
            include: [
              {
                model: taikhoan,
                as: "MaTK_taikhoan", // Đảm bảo alias đúng
                attributes: ["HoTen", "SDT"],
              },
            ],
          },
        ],
        order: [
          [
            sequelize.literal(
              `CASE WHEN giaodich_vi.TrangThai = 'DangXuLy' THEN 1 ELSE 2 END`
            ),
            "ASC",
          ],
          ["NgayTao", "DESC"],
        ],
      });

      res.json({
        success: true,
        data: list,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi lấy danh sách rút tiền" });
    }
  },
};
