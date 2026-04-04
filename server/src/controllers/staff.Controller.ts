// controllers/staff.Controller.ts
import { Request, Response } from "express";
import { Table } from "../models/Table";
import { Order } from "../models/Order";
import { User } from "../models/User";
import { io } from "..";

// @desc    Assign Table to Waiter
// @route   PUT /api/staff/assign-table
export const assignTableWaiter = async (req: Request, res: Response) => {
  try {
    const { tableId, waiterId } = req.body;
    const table = await Table.findById(tableId);
    if (!table) return res.status(404).json({ success: false, message: "Table not found" });

    table.assignedWaiter = waiterId || null;
    await table.save();

    io.emit("tableAssigned", { tableId, waiterId });
    return res.status(200).json({ success: true, data: table });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get Waiter Dashboard Data
// @route   GET /api/staff/my-tables
export const getMyTables = async (req: any, res: Response) => {
  try {
    const waiterId = req.user.id;
    const tables = await Table.find({ assignedWaiter: waiterId }).populate("floor");
    const pendingOrders = await Order.find({ 
      table: { $in: tables.map(t => t._id) },
      status: { $in: ["pending", "preparing", "ready"] }
    }).populate("items.product");

    return res.status(200).json({ success: true, data: { tables, pendingOrders } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Calculate Kitchen Load
// @route   GET /api/staff/kitchen-load
export const getKitchenLoad = async (req: Request, res: Response) => {
  try {
    // Load logic: number of active orders
    const activeOrders = await Order.countDocuments({ status: { $in: ["pending", "preparing"] } });
    
    let load: "low" | "medium" | "high" = "low";
    if (activeOrders > 15) load = "high";
    else if (activeOrders > 5) load = "medium";

    return res.status(200).json({ success: true, data: { load, count: activeOrders } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
