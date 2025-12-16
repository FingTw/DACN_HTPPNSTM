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
  getOrderDetail,
  getAvailableShippingMethods,  
  validateShippingMethod  
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

// ==================== PHƯƠNG THỨC VẬN CHUYỂN MỚI ====================
// 🆕 Tính toán phí vận chuyển theo loại giao hàng (standard/fast/express/super_express)
router.post("/calculate-shipping", calculateShipping);

// 🆕 Lấy tất cả phương thức vận chuyển khả dụng cho địa chỉ
router.post("/shipping/methods", getAvailableShippingMethods);

// 🆕 Validate phương thức vận chuyển trước khi checkout
router.post("/shipping/validate", validateShippingMethod);

// ==================== PHƯƠNG THỨC VẬN CHUYỂN/THANH TOÁN ====================
// Lấy danh sách phương thức vận chuyển (cấu hình trong DB)
router.get("/shipping-methods", getShippingMethods);

// Lấy danh sách phương thức thanh toán
router.get("/payment-methods", getPaymentMethods);

// ==================== QUẢN LÝ ĐƠN HÀNG ====================
// Lấy tất cả đơn hàng của người dùng
router.get("/all", getAllOrder);

// Lấy đơn hàng theo trạng thái
router.get("/status/:status", getOrdersByStatus);

// ==================== QUẢN LÝ ĐƠN HÀNG THEO CỬA HÀNG ====================
// 🆕 Lấy đơn hàng theo cửa hàng (cho order manager)
router.get("/cua-hang/:MaCH", getStoreOrders);

// 🆕 Cập nhật trạng thái bởi cửa hàng
router.put("/:MaDH/trang-thai-cua-hang", updateOrderStatusByStore);

// 🆕 Thống kê đơn hàng theo cửa hàng
router.get("/cua-hang/:MaCH/thong-ke", getOrderStatistics);

// 🆕 Chi tiết đơn hàng
router.get("/chi-tiet/:MaDH", getOrderDetail);

export default router;