// controllers/orderController.ts
import { Request, Response } from "express";
import { Order } from "../models/Order";
import { Table } from "../models/Table";
import { Types } from "mongoose";
import { getTodayOrderSummary } from "./orderSummaryService.controller";
import { io } from "..";
import { Session } from "../models/Session";
import { AuthRequest } from "../middleware/authMiddleware";
import jwt from "jsonwebtoken";
import { calculateOrderPriority } from "../utils/priority";
import { calculateWaitTime } from "../utils/waitTimer";

export const getTodayOrderSummaryController = async (
  req: Request,
  res: Response
) => {
  try {
    const summary = await getTodayOrderSummary();
    return res.status(200).json({ success: true, data: summary });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { items, paymentMethod, tableId, discountPercent, taxRate, sessionId, isCustomerOrder } =
      req.body;
    const waiterId = (req as any).user?.id;
    const isCustomer = isCustomerOrder || false;

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No items provided" });
    }

    let totalPrice = 0;
    for (const item of items) {
       if (item.quantity <= 0 || item.price < 0) {
          return res.status(400).json({ success: false, message: "Invalid item quantity or price" });
       }
       totalPrice += item.price * item.quantity;
    }

    // Capture staff manually since POST /api/orders is public for guests
    let staffId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET || "secretkey") as any;
        staffId = decoded.id;
      } catch (e) {} // Guest, ignore
    }

    // Verify and occupy table AND assign staff
    let verifiedTableId = null;
    let autoStaffId = staffId;
    if (tableId) {
       const table = await Table.findById(tableId);
       if (!table) return res.status(404).json({ success: false, message: "Table not found" });
       verifiedTableId = table._id;
       table.status = "occupied";
       await table.save();
       
       // Auto-assign waiter if not already set (e.g. customer order)
       if (!autoStaffId && table.assignedWaiter) {
          autoStaffId = table.assignedWaiter;
       }
    }

    const activeSession = await Session.findOne({ status: "open" }).sort({ createdAt: -1 });

    const order = await Order.create({
      items,
      totalPrice,
      discountPercent: discountPercent || 0,
      taxRate: taxRate || 0,
      paymentMethod: paymentMethod || "cash",
      table: verifiedTableId,
      status: isCustomer ? "draft" : "pending",
      isCustomerOrder: isCustomer,
      sessionId: activeSession?._id,
      responsibleStaff: autoStaffId,
    });

    // ── INITIAL PRIORITY & WAIT-TIME CALCULATION ────────────────────────────
    const pendingCount = await Order.countDocuments({ status: { $in: ["pending", "preparing"] } });
    const { score, level } = calculateOrderPriority(order as any);
    order.priorityScore = score;
    order.priorityLevel = level;
    order.estimatedTime = calculateWaitTime(order as any, pendingCount);
    await order.save();
    // ────────────────────────────────────────────────────────────────────────
    await order.populate("table items.product responsibleStaff");
    
    // Emit to KDS & Staff
    io.emit("newOrder", order);
    if (order.status === "draft") {
       io.emit(`newDraftOrder:${order.responsibleStaff}`, order);
    }
    
    const summary = await getTodayOrderSummary();
    io.emit("orderSummaryUpdate", summary);
    return res.status(201).json({ success: true, data: order });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const confirmDraftOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const waiterId = req.user?.id;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    
    // Authorization check: only assigned waiter or admin can confirm
    if (order.responsibleStaff?.toString() !== waiterId?.toString() && req.user?.role !== "admin") {
       return res.status(403).json({ message: "You are not assigned to this table/order" });
    }

    order.status = "pending";
    order.waiterConfirmed = true;
    await order.save();
    await order.populate("table items.product responsibleStaff");

    io.emit("orderConfirmed", order);
    io.emit("orderUpdated", order);

    res.json({ success: true, message: "Order confirmed and sent to kitchen", data: order });
  } catch (error) {
    res.status(500).json({ message: "Error confirming order", error });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    let {
      page = 1,
      limit = 10,
      status,
      tableId,
      startDate,
      endDate,
      orderId,
    } = req.query;

    const query: any = {};
    if (status && status !== "all") {
      if (typeof status === "string" && status.includes(",")) {
        query.status = { $in: status.split(",") };
      } else {
        query.status = status;
      }
    }
    if (tableId) query.table = tableId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    // 🔎 If searching by customOrderID
    if (orderId) {
      query.customOrderID = {
        $regex: new RegExp(orderId as string, "i"),
      };
    }

    // Prevent OOM with bounded limit
    const safeLimit = Math.min(Number(limit), 100);

    const orders = await Order.find(query)
      .populate("table")
      .populate({
        path: "items.product",
        select: "-imageUrl",
      })
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * safeLimit)
      .limit(safeLimit);

    // ── LIVE PRIORITY RE-CALCULATION ───────────────────────────────────────
    // Before returning active orders to UI, we refresh their priority based on 
    // real-time waiting minutes.
    const ordersWithPriority = await Promise.all(orders.map(async (o: any) => {
      if (["pending", "preparing"].includes(o.status)) {
        const { score, level } = calculateOrderPriority(o);
        o.priorityScore = score;
        o.priorityLevel = level;
        // Optimization: only save if status is pending/preparing to keep scores alive
        // for sorting. No need to await full save for throughput.
        o.save().catch(() => {}); 
      }
      return o;
    }));

    // Re-sort by priority score for active orders
    const sortedOrders = ordersWithPriority.sort((a: any, b: any) => {
      if (a.status === "ready" && b.status !== "ready") return 1;
      if (b.status === "ready" && a.status !== "ready") return -1;
      return (b.priorityScore || 0) - (a.priorityScore || 0);
    });

    const total = await Order.countDocuments(query);

    return res.json({
      data: sortedOrders,
      pagination: {
        total,
        page: Number(page),
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate("items.product")
      .populate("table");

    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    return res.status(200).json({ success: true, data: order });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, items, paymentMethod, tableId, isPriorityBoosted, confirmedTime, waiterConfirmed } = req.body;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;

    const order = await Order.findById(id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    const oldStatus = order.status;
    if (status) {
      order.status = status;
      // If order is being completed, track the cashier
      if (status === "completed" && oldStatus !== "completed" && currentUserRole === "cashier") {
        order.cashierId = currentUserId as any;
      }
    }
    if (paymentMethod) order.paymentMethod = paymentMethod;
    if (isPriorityBoosted !== undefined) order.isPriorityBoosted = isPriorityBoosted;
    if (waiterConfirmed !== undefined) order.waiterConfirmed = waiterConfirmed;

    // Allow item updates during review
    if (items && Array.isArray(items) && items.length > 0) {
        order.items = items;
        let newTotal = 0;
        items.forEach((it: any) => { 
          newTotal += (it.price || 0) * (it.quantity || 0); 
        });
        order.totalPrice = newTotal;
    }

    // Handle Chef Confirmation of Prep Time
    if (confirmedTime !== undefined) {
      order.confirmedTime = confirmedTime;
      order.timeConfirmedAt = new Date();
      console.log(`[WAIT-TIME] Chef confirmed ${order.confirmedTime}m for order ${order.customOrderID}`);
      // Auto-transition to preparing if chef confirms time
      if (order.status === "pending") order.status = "preparing";
    }

    if (tableId) {
      const table = await Table.findById(tableId);
      if (!table)
        return res
          .status(404)
          .json({ success: false, message: "Table not found" });
      order.table = table._id as Types.ObjectId;
    }

    await order.save();

    // ── RE-CALCULATE PRIORITY ───────────────────────────────────────────────
    if (["pending", "preparing"].includes(order.status)) {
      const { score, level } = calculateOrderPriority(order as any);
      order.priorityScore = score;
      order.priorityLevel = level;
      await order.save();
    }
    // ────────────────────────────────────────────────────────────────────────

    // Table Lifecycle Sync
    if (order.table && ["served", "completed", "cancelled"].includes(order.status) && !["served", "completed", "cancelled"].includes(oldStatus)) {
       await Table.findByIdAndUpdate(order.table, { status: "free" });
    }

    await order.populate("table items.product");
    
    // Notify KDS of update
    io.emit("orderUpdated", order);
    
    const summary = await getTodayOrderSummary();
    io.emit("orderSummaryUpdate", summary);

    return res.status(200).json({ success: true, data: order });
  } catch (err: any) {
    console.error("Order Update Error:", err);
    return res.status(500).json({ success: false, message: err.message, stack: err.stack });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndDelete(id);

    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    return res
      .status(200)
      .json({ success: true, message: "Order deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/orders/:id/items/:itemId/status
 *
 * Kitchen marks a single item as: pending | preparing | unavailable | completed
 *
 * When an item is marked "unavailable":
 *  1. Its itemStatus is updated atomically in MongoDB
 *  2. The order's totalPrice is recalculated (excluding unavailable items)
 *  3. Socket.io emits "itemStatusChanged" to ALL clients (kitchen, waiter, billing)
 *  4. If ALL items become unavailable → entire order is auto-cancelled
 */
export const updateItemStatus = async (req: Request, res: Response) => {
  try {
    const { id, itemId } = req.params;
    const { itemStatus } = req.body;

    const validStatuses = ["pending", "preparing", "unavailable", "completed"];
    if (!validStatuses.includes(itemStatus)) {
      return res.status(400).json({ success: false, message: "Invalid itemStatus value" });
    }

    // Load order with full product populate for bill recalculation
    const order = await Order.findById(id).populate("items.product table");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Find the specific item by its sub-document _id
    const item = order.items.find((i: any) => i._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found in order" });
    }

    // Update item status
    item.itemStatus = itemStatus as any;

    // ── AUTO BILL RECALCULATION ──────────────────────────────────────────────
    // Only count items that are NOT unavailable when computing the total
    const activeItems = order.items.filter(
      (i: any) => i.itemStatus !== "unavailable"
    );
    const rawTotal = activeItems.reduce(
      (sum: number, i: any) => sum + i.price * i.quantity,
      0
    );
    const discount = order.discountPercent || 0;
    const tax = order.taxRate || 0;
    const discountedTotal = rawTotal - (rawTotal * discount) / 100;
    order.totalPrice = parseFloat(
      (discountedTotal + (discountedTotal * tax) / 100).toFixed(2)
    );
    // ────────────────────────────────────────────────────────────────────────

    // If ALL items are unavailable → auto-cancel the entire order
    const allUnavailable = order.items.every(
      (i: any) => i.itemStatus === "unavailable"
    );
    if (allUnavailable) {
      order.status = "cancelled";
    }

    await order.save();

    // ── RE-CALCULATE PRIORITY ───────────────────────────────────────────────
    if (["pending", "preparing"].includes(order.status)) {
      const { score, level } = calculateOrderPriority(order as any);
      order.priorityScore = score;
      order.priorityLevel = level;
      await order.save();
    }
    // ────────────────────────────────────────────────────────────────────────

    // ── REAL-TIME BROADCAST ──────────────────────────────────────────────────
    // Event 1: granular item-level change (Kitchen / Waiter screens)
    io.emit("itemStatusChanged", {
      orderId: order._id,
      itemId,
      itemStatus,
      updatedOrder: order,
    });

    // Event 2: full order update so billing always recalculates from latest state
    io.emit("orderUpdated", order);

    // Event 3: update today's summary widget on the admin dashboard
    const summary = await getTodayOrderSummary();
    io.emit("orderSummaryUpdate", summary);
    // ────────────────────────────────────────────────────────────────────────

    return res.status(200).json({
      success: true,
      data: order,
      meta: {
        recalculatedTotal: order.totalPrice,
        allUnavailable,
        autoStatusChange: allUnavailable ? "cancelled" : null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

