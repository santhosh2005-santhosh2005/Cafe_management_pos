// routes/orderRoutes.ts
import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getTodayOrderSummaryController,
  updateItemStatus,
  confirmDraftOrder,
} from "../controllers/order.Controller";
import {
  getSalesLast7Days,
  getOrderReport,
} from "../controllers/orderReport.Controller";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// @route   POST /api/orders
router.post("/", authMiddleware, createOrder);

// @route   GET /api/orders
router.get("/", authMiddleware, getOrders);

// Summary routes (must be BEFORE /:id to avoid param conflict)
router.get("/summary/today", authMiddleware, getTodayOrderSummaryController);
router.get("/summary/report", authMiddleware, getOrderReport);
router.get("/sales/last-7-days", authMiddleware, getSalesLast7Days);

// @route   GET /api/orders/:id
router.get("/:id", authMiddleware, getOrderById);

// @route   PUT /api/orders/:id
router.put("/:id", authMiddleware, updateOrder);

// @route   DELETE /api/orders/:id
router.delete("/:id", authMiddleware, deleteOrder);

// @route   PATCH /api/orders/:id/items/:itemId/status
// @desc    Kitchen marks individual item as unavailable / completed etc.
router.patch("/:id/items/:itemId/status", authMiddleware, updateItemStatus);

// @route   PATCH /api/orders/:id/confirm
// @desc    Staff/Waiter verifies and confirms draft order to kitchen
router.patch("/:id/confirm", authMiddleware, confirmDraftOrder);

export default router;

