import express from "express";
import { walletController } from "../controllers/walletController.js";
// Import middleware xác thực nếu cần bảo mật
// import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// 1. Lấy thông tin ví và lịch sử giao dịch
// GET /api/wallet/:MaCH
router.get("/:MaCH", walletController.getWalletInfo);

// 2. Tạo yêu cầu rút tiền
// POST /api/wallet/withdraw
router.post("/withdraw", walletController.requestWithdraw);

// 3. Admin xử lý rút tiền (Duyệt/Từ chối) - Nếu bạn đã làm function này
// POST /api/wallet/admin/handle
router.post("/admin/handle", walletController.adminHandleWithdraw);

export default router;
