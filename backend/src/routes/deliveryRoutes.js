import express from "express";
import {
  assignDelivery,
  customerConfirmDelivery,
  shipperUploadProof,
  shipperTakeOrder,
  shipperPickupOrder,
} from "../controllers/deliveryController.js"; // hoặc deliveryController.js

const router = express.Router();

// Admin assign shipper
router.post("/assign", assignDelivery);

// Shipper tự nhận đơn
router.post("/take", shipperTakeOrder);

// Shipper xác nhận đã lấy hàng (pickup)
router.post("/pickup", shipperPickupOrder);

// Shipper upload proof (multipart/form-data)
router.post("/:MaGH/proof", shipperUploadProof);

// Customer confirm
router.post("/:MaGH/confirm", customerConfirmDelivery);

export default router;
