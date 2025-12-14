import express from "express";
import employeeController from "../controllers/employeeController.js";
import { authenticateToken } from "../controllers/cuahangController.js";
import upload from "../config/upload.js";
import { warehouseController } from "../controllers/warehouseController.js";

const router = express.Router();

router.use(authenticateToken);

// Shipper
router.get("/deliveries", employeeController.getDeliveries);
router.post("/deliveries/take", employeeController.takeDelivery);
router.put(
  "/deliveries/:MaGH",
  upload.single("proof"),
  employeeController.updateDeliveryStatus
);

// Warehouse
router.get("/warehouse/list", warehouseController.getAllWarehouses);
router.get("/warehouse/orders", warehouseController.getWarehouseOrders);
router.post(
  "/warehouse/import-order",
  warehouseController.importOrderToWarehouse
);
router.post(
  "/warehouse/export-order",
  warehouseController.exportOrderFromWarehouse
);

export default router;
