import express from "express";
import { paypalController } from "../controllers/paypalController.js";

const router = express.Router();

router.post("/paypal/create", paypalController.createPayment);
router.post("/paypal/capture", paypalController.capturePayment);

export default router;
