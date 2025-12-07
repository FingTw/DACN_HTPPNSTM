// src/controllers/paypalController.js
import paypal from "@paypal/checkout-server-sdk";
import paypalClient from "../config/paypal.js";
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";

const models = initModels(sequelize);
const { donhang, thanhtoan } = models;

export const paypalController = {
  // 1. TẠO GIAO DỊCH (Gửi sang PayPal)
  createPayment: async (req, res) => {
    try {
      const { MaDH } = req.body;
      const order = await donhang.findByPk(MaDH);

      if (!order)
        return res.status(404).json({ message: "Đơn hàng không tồn tại" });

      // 🔴 QUY ĐỔI VND SANG USD (Vì PayPal không nhận VND)
      const tyGia = process.env.EXCHANGE_RATE || 25000;
      const totalUSD = (parseFloat(order.TongTien) / tyGia).toFixed(2);

      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: MaDH, // Gắn mã đơn hàng của mình vào để dễ tìm
            amount: {
              currency_code: "USD",
              value: totalUSD,
            },
          },
        ],
        application_context: {
          // Link khi khách hủy hoặc thành công (Frontend route)
          return_url: `${process.env.FRONTEND_URL}/checkout/success?orderId=${MaDH}`,
          cancel_url: `${process.env.FRONTEND_URL}/checkout/fail?orderId=${MaDH}`,
        },
      });

      const response = await paypalClient.execute(request);

      // Lưu OrderID vào DB
      await thanhtoan.update(
        { GhiChu: `PayPal_OrderID: ${response.result.id}` },
        { where: { MaDH: MaDH } }
      );

      return res.json({
        success: true,
        id: response.result.id,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message });
    }
  },

  capturePayment: async (req, res) => {
    // Frontend gửi lên: { token: 'PAYPAL_ORDER_ID' }
    const { token } = req.body;

    const request = new paypal.orders.OrdersCaptureRequest(token);
    request.requestBody({});

    try {
      const capture = await paypalClient.execute(request);

      if (capture.result.status === "COMPLETED") {
        // 🟢 QUAN TRỌNG: Tìm đơn hàng nào có GhiChu chứa PayPal Order ID này
        // (Lúc createPayment ta đã lưu: "PayPal_OrderID: ...")
        const order = await donhang.findOne({
          include: [
            {
              model: thanhtoan,
              as: "thanhtoan",
              where: { GhiChu: { [Op.like]: `%${token}%` } }, // Tìm trong bảng thanh toán
            },
          ],
        });

        // Nếu không tìm thấy trong thanhtoan, thử tìm cách khác hoặc truyền MaDH từ frontend nếu có thể
        // Nhưng cách tìm này an toàn hơn.

        if (order) {
          await sequelize.transaction(async (t) => {
            await thanhtoan.update(
              {
                TrangThai: "Đã thanh toán",
                Thoigian: new Date(),
                NoiDung: `PayPal Captured: ${capture.result.id}`,
              },
              { where: { MaDH: order.MaDH }, transaction: t }
            );

            await donhang.update(
              { TrangThai: "Chờ xác nhận" }, // Hoặc trạng thái tiếp theo
              { where: { MaDH: order.MaDH }, transaction: t }
            );
          });
          return res.json({ success: true, message: "Thanh toán thành công" });
        }

        // Fallback nếu không tìm thấy đơn (hiếm gặp nếu flow đúng)
        return res.json({
          success: true,
          message: "Thanh toán thành công (Chưa update đơn)",
        });
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Thanh toán chưa hoàn tất" });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi xử lý thanh toán PayPal" });
    }
  },
};
