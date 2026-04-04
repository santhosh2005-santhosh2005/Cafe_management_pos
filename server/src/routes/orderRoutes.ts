// routes/orderRoutes.ts
import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getTodayOrderSummaryController,
} from "../controllers/order.Controller";
import {
  getSalesLast7Days,
  getOrderReport,
} from "../controllers/orderReport.Controller";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// @route   POST /api/orders
// @desc    Create a new order
router.post("/", createOrder);

// @route   GET /api/orders
// @desc    Get all orders
router.get("/", authMiddleware, getOrders);

// @route   GET /api/orders/:id
// @desc    Get single order by ID
router.get("/:id", authMiddleware, getOrderById);

// @route   PUT /api/orders/:id
// @desc    Update order (status/paymentMethod)
router.put("/:id", authMiddleware, updateOrder);

// @route   DELETE /api/orders/:id
// @desc    Delete order
router.delete("/:id", authMiddleware, deleteOrder);

router.get("/summary/today", authMiddleware, getTodayOrderSummaryController);

// 📊 Sales summary
router.get("/summary/report", authMiddleware, getOrderReport);
router.get("/sales/last-7-days", authMiddleware, getSalesLast7Days);
export default router;
