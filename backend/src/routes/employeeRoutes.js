import express from "express";
import employeeController from "../controllers/employeeController.js";
import { authenticateToken } from "../controllers/cuahangController.js";
import upload from "../config/upload.js";

const router = express.Router();

// All routes require authentication
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
router.post("/xnt", employeeController.createXNT);

export default router;
