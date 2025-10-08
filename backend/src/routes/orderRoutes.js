import express from "express";
import {
  checkout,
  checkoutItem,
  processCheckout,
  orderSuccess
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

export default router;
