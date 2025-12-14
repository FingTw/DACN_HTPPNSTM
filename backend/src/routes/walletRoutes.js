import express from "express";
import { walletController } from "../controllers/walletController.js";
import { authenticateToken } from "../controllers/cuahangController.js";

const router = express.Router();

router.get("/:MaCH", authenticateToken, walletController.getWalletInfo);

router.post("/withdraw", walletController.requestWithdraw);

router.post("/admin/handle", walletController.adminHandleWithdraw);

export default router;
