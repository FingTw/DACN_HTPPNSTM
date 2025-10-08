import express from "express";
import {
  addToCart,
  updateQuantity,
  removeFromCart,
  getCartCount
} from "../controllers/cartController.js";

const router = express.Router();

// Không cần middleware, chỉ map thẳng routes → controller
router.post("/add", addToCart);
router.post("/update", updateQuantity);
router.post("/remove", removeFromCart);
router.get("/count", getCartCount);

export default router;
