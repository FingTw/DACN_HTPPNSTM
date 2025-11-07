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
import { authenticate, authorize, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

/* ============================
 📋 API CHO NGƯỜI MUA (BUYER)
============================ */

/**
 * @route   POST /api/rfq/buyer/requests
 * @desc    Tạo yêu cầu mua hàng mới
 * @access  Private (Buyer, Admin)
 */
router.post(
  "/buyer/requests",
  authenticate,
  authorize(["Buyer", "Admin"]),
  createBuyerRequest
);

/**
 * @route   GET /api/rfq/buyer/requests
 * @desc    Xem danh sách yêu cầu của mình
 * @access  Private (Buyer, Admin)
 */
router.get(
  "/buyer/requests",
  authenticate,
  authorize(["Buyer", "Admin"]),
  getMyRequests
);

/**
 * @route   GET /api/rfq/buyer/requests/:MaYCDH/proposals
 * @desc    Xem tất cả đề nghị cho một yêu cầu cụ thể
 * @access  Private (Buyer, Admin)
 */
router.get(
  "/buyer/requests/:MaYCDH/proposals",
  authenticate,
  authorize(["Buyer", "Admin"]),
  getProposalsForRequest
);

/**
 * @route   POST /api/rfq/buyer/proposals/accept
 * @desc    Chấp nhận đề nghị và tạo đơn hàng (tự động trừ tồn kho)
 * @access  Private (Buyer, Admin)
 */
router.post(
  "/buyer/proposals/accept",
  authenticate,
  authorize(["Buyer", "Admin"]),
  acceptProposalAndCreateOrder
);

/**
 * @route   PUT /api/rfq/buyer/proposals/:MaDNCC/reject
 * @desc    Từ chối đề nghị
 * @access  Private (Buyer, Admin)
 */
router.put(
  "/buyer/proposals/:MaDNCC/reject",
  authenticate,
  authorize(["Buyer", "Admin"]),
  rejectProposal
);

/**
 * @route   GET /api/rfq/buyer/statistics
 * @desc    Xem thống kê yêu cầu và đề nghị
 * @access  Private (Buyer, Admin)
 */
router.get(
  "/buyer/statistics",
  authenticate,
  authorize(["Buyer", "Admin"]),
  getBuyerStatistics
);

/* ============================
 🏪 API CHO NGƯỜI BÁN (SELLER)
============================ */

/**
 * @route   GET /api/rfq/seller/requests
 * @desc    Xem tất cả yêu cầu đang mở (có thể đề nghị)
 * @access  Private (Seller, Admin) hoặc Public
 */
router.get("/seller/requests", optionalAuth, getAllOpenRequests);

/**
 * @route   GET /api/rfq/seller/requests/new
 * @desc    Xem yêu cầu mới trong 24h (để thông báo)
 * @access  Private (Seller, Admin)
 */
router.get(
  "/seller/requests/new",
  authenticate,
  authorize(["Seller", "Admin"]),
  getNewRequestsForSeller
);

/**
 * @route   GET /api/rfq/seller/products
 * @desc    Xem sản phẩm của mình để chọn khi đề nghị
 * @access  Private (Seller, Admin)
 */
router.get(
  "/seller/products",
  authenticate,
  authorize(["Seller", "Admin"]),
  getMyProductsForProposal
);

/**
 * @route   POST /api/rfq/seller/proposals
 * @desc    Gửi đề nghị cung cấp sản phẩm (chọn từ sản phẩm có sẵn)
 * @access  Private (Seller, Admin)
 */
router.post(
  "/seller/proposals",
  authenticate,
  authorize(["Seller", "Admin"]),
  submitProposal
);

/**
 * @route   GET /api/rfq/seller/proposals
 * @desc    Xem danh sách đề nghị của mình
 * @access  Private (Seller, Admin)
 */
router.get(
  "/seller/proposals",
  authenticate,
  authorize(["Seller", "Admin"]),
  getMyProposals
);

/**
 * @route   PUT /api/rfq/seller/proposals/:MaDNCC
 * @desc    Cập nhật đề nghị (sửa giá, số lượng, mô tả)
 * @access  Private (Seller, Admin)
 */
router.put(
  "/seller/proposals/:MaDNCC",
  authenticate,
  authorize(["Seller", "Admin"]),
  updateProposal
);

/**
 * @route   DELETE /api/rfq/seller/proposals/:MaDNCC
 * @desc    Hủy đề nghị của mình (nếu chưa được chấp nhận)
 * @access  Private (Seller, Admin)
 */
router.delete(
  "/seller/proposals/:MaDNCC",
  authenticate,
  authorize(["Seller", "Admin"]),
  cancelProposal
);

/**
 * @route   GET /api/rfq/seller/statistics
 * @desc    Xem thống kê đề nghị (tỷ lệ chấp nhận, doanh thu...)
 * @access  Private (Seller, Admin)
 */
router.get(
  "/seller/statistics",
  authenticate,
  authorize(["Seller", "Admin"]),
  getSellerStatistics
);

/* ============================
 🌐 API CÔNG KHAI (PUBLIC)
============================ */

/**
 * @route   GET /api/rfq/public/requests
 * @desc    Xem yêu cầu công khai (không cần đăng nhập)
 * @access  Public
 */
router.get("/public/requests", getAllOpenRequests);

export default router;
