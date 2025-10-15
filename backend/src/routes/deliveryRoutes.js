import express from "express";
import { assignDelivery, 
         customerConfirmDelivery, 
         shipperUploadProof } 
from "../controllers/deliveryController.js"; // hoặc deliveryController.js

const router = express.Router();

// Admin assign shipper
router.post("/assign", assignDelivery);

// Shipper upload proof (multipart/form-data) 
router.post("/:MaGH/proof", shipperUploadProof);

// Customer confirm
router.post("/:MaGH/confirm", customerConfirmDelivery);

export default router;
