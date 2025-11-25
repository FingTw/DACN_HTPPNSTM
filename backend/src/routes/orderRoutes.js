// routes/orderRoutes.js
import express from "express";
import {
  checkout,
  checkoutItem,
  processCheckout,
  orderSuccess,
  updateOrderStatus,
  getShippingMethods,
  getPaymentMethods,
  getAllOrder,
  getOrdersByStatus,
  calculateShipping,
  getStoreOrders,
  updateOrderStatusByStore,
  getOrderStatistics,
  getOrderDetail
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

// 🆕 Tính toán phí vận chuyển theo khoảng cách thực tế
router.post("/calculate-shipping", calculateShipping);

// Lấy phương thức vận chuyển
router.get("/shipping-methods", getShippingMethods);

// Lấy phương thức thanh toán
router.get("/payment-methods", getPaymentMethods);

// Lấy tất cả đơn hàng
router.get("/all", getAllOrder);
router.get("/status/:status", getOrdersByStatus);
// 🆕 CÁC ENDPOINTS MỚI CHO ORDER MANAGER
router.get("/cua-hang/:MaCH", getStoreOrders); // Lấy đơn hàng theo cửa hàng
router.put("/:MaDH/trang-thai-cua-hang", updateOrderStatusByStore); // Cập nhật trạng thái bởi cửa hàng
router.get("/cua-hang/:MaCH/thong-ke", getOrderStatistics); // Thống kê đơn hàng
router.get("/chi-tiet/:MaDH", getOrderDetail); // Chi tiết đơn hàng

export default router;