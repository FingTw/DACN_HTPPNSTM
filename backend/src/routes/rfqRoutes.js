// routes/rfqRoutes.js
import express from "express";
import {
  createBuyerRequest,
  getMyRequests,
  getAllOpenRequests,
  submitProposal,
  getProposalsForRequest,
  acceptProposalAndCreateOrder,
  rejectProposal,
  getBuyerStatistics,
  getSellerStatistics,
  getMyProposals,
  cancelProposal,
  updateProposal,
  getMyProductsForProposal,
  getNewRequestsForSeller,
} from "../controllers/rfqController.js";

const router = express.Router();

/* ============================
 📋 API CHO NGƯỜI MUA (BUYER)
============================ */

// Tạo yêu cầu mua hàng mới
router.post("/buyer/requests", createBuyerRequest);

// Xem danh sách yêu cầu của mình
router.get("/buyer/requests", getMyRequests);

// Xem tất cả đề nghị cho một yêu cầu cụ thể
router.get("/buyer/requests/:MaYCDH/proposals", getProposalsForRequest);

// Chấp nhận đề nghị và tạo đơn hàng
router.post("/buyer/proposals/accept", acceptProposalAndCreateOrder);

// Từ chối đề nghị
router.put("/buyer/proposals/:MaDNCC/reject", rejectProposal);

// Xem thống kê
router.get("/buyer/statistics", getBuyerStatistics);

/* ============================
 🏪 API CHO NGƯỜI BÁN (SELLER)
============================ */

// Xem tất cả yêu cầu đang mở
router.get("/seller/requests", getAllOpenRequests);

// Xem yêu cầu mới trong 24h
router.get("/seller/requests/new", getNewRequestsForSeller);

// Xem sản phẩm của mình để chọn khi đề nghị
router.get("/seller/products", getMyProductsForProposal);

// Gửi đề nghị cung cấp sản phẩm
router.post("/seller/proposals", submitProposal);

// Xem danh sách đề nghị của mình
router.get("/seller/proposals", getMyProposals);

// Cập nhật đề nghị
router.put("/seller/proposals/:MaDNCC", updateProposal);

// Hủy đề nghị
router.delete("/seller/proposals/:MaDNCC", cancelProposal);

// Xem thống kê
router.get("/seller/statistics", getSellerStatistics);

/* ============================
 🌐 API CÔNG KHAI (PUBLIC)
============================ */

// Xem yêu cầu công khai (không cần đăng nhập)
router.get("/public/requests", getAllOpenRequests);

export default router;
