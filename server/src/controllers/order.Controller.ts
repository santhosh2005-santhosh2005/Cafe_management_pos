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
    const { items, paymentMethod, tableId, discountPercent, taxRate } =
      req.body;

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

    // Verify and occupy table
    let verifiedTableId = null;
    if (tableId) {
       const table = await Table.findById(tableId);
       if (!table) return res.status(404).json({ success: false, message: "Table not found" });
       verifiedTableId = table._id;
       table.status = "occupied";
       await table.save();
    }

    const activeSession = await Session.findOne({ status: "open" }).sort({ createdAt: -1 });

    const order = await Order.create({
      items,
      totalPrice,
      discountPercent: discountPercent || 0,
      taxRate: taxRate || 0,
      paymentMethod: paymentMethod || "cash",
      table: verifiedTableId,
      sessionId: activeSession?._id,
      responsibleStaff: staffId,
    });
    await order.populate("table items.product responsibleStaff");
    
    // Emit to KDS
    io.emit("newOrder", order);
    
    const summary = await getTodayOrderSummary();
    io.emit("orderSummaryUpdate", summary);
    return res.status(201).json({ success: true, data: order });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    let {
      page = 1,
      limit = 10,
      status,

      startDate,
      endDate,
      orderId,
    } = req.query;

    const query: any = {};
    if (status && status !== "all") query.status = status;
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

    const total = await Order.countDocuments(query);

    return res.json({
      data: orders,
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

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paymentMethod, tableId } = req.body;

    const order = await Order.findById(id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    const oldStatus = order.status;
    if (status) order.status = status;
    if (paymentMethod) order.paymentMethod = paymentMethod;

    if (tableId) {
      const table = await Table.findById(tableId);
      if (!table)
        return res
          .status(404)
          .json({ success: false, message: "Table not found" });
      order.table = table._id as Types.ObjectId;
    }

    await order.save();

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
    return res.status(500).json({ success: false, message: err.message });
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
