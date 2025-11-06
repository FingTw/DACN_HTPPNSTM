import express from "express";
import {
  checkout,
  checkoutItem,
  processCheckout,
  orderSuccess,
  updateOrderStatus,
  getShippingMethods,
  getPaymentMethods
} from "../controllers/orderController.js";

const router = express.Router();

// Xem giỏ hàng trước khi checkout
router.get("/checkout", checkout);

// Checkout 1 sản phẩm
router.post("/checkout-item", checkoutItem);

// Thực hiện checkout / đặt hàng
router.post("/process-checkout", processCheckout);

// Xem chi tiết đơn hàng thành công
router.get("/order-success/:MaDH", orderSuccess);

// Cập nhật trạng thái đơn hàng (admin)
router.put("/update-status/:MaDH", updateOrderStatus);

// Thêm vào routes/orderRoutes.js
router.get("/shipping-methods", getShippingMethods);
router.get("/payment-methods", getPaymentMethods);

export default router;
