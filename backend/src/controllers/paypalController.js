// src/controllers/paypalController.js
import paypal from "@paypal/checkout-server-sdk";
import paypalClient from "../config/paypal.js";
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";

const models = initModels(sequelize);
const { donhang, thanhtoan } = models;

export const paypalController = {
  // 1. TẠO GIAO DỊCH
  createPayment: async (req, res) => {
    try {
      const { MaDH } = req.body;
      const order = await donhang.findByPk(MaDH);

      if (!order)
        return res.status(404).json({ message: "Đơn hàng không tồn tại" });

      const tyGia = process.env.EXCHANGE_RATE || 25000;
      const totalUSD = (parseFloat(order.TongTien) / tyGia).toFixed(2);

      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: MaDH,
            amount: { currency_code: "USD", value: totalUSD },
          },
        ],
      });

      const response = await paypalClient.execute(request);

      // ⚠️ ĐÃ XÓA: Không cần lưu PayPal ID vào DB nữa vì không có cột GhiChu

      return res.json({ success: true, id: response.result.id });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message });
    }
  },

  // 2. XÁC NHẬN THANH TOÁN
  capturePayment: async (req, res) => {
    // 👇 SỬA: Nhận thêm MaDH từ frontend gửi lên
    const { token, MaDH } = req.body;

    if (!MaDH) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu mã đơn hàng (MaDH)" });
    }

    const request = new paypal.orders.OrdersCaptureRequest(token);
    request.requestBody({});

    try {
      const capture = await paypalClient.execute(request);

      if (capture.result.status === "COMPLETED") {
        await sequelize.transaction(async (t) => {
          await thanhtoan.update(
            {
              TrangThai: "Đã thanh toán",
              Thoigian: sequelize.literal("CURRENT_TIME"),
            },
            { where: { MaDH: MaDH }, transaction: t }
          );
          await donhang.update(
            { TrangThai: "Chờ xác nhận" },
            { where: { MaDH: MaDH }, transaction: t }
          );
        });

        return res.json({ success: true, message: "Thanh toán thành công" });
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Thanh toán chưa hoàn tất" });
      }
    } catch (err) {
      console.error("Lỗi PayPal Capture:", err);
      return res.status(500).json({ message: "Lỗi xử lý thanh toán PayPal" });
    }
  },
};
