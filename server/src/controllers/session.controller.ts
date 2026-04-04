import { Request, Response } from "express";
import { Session } from "../models/Session";
import { Order } from "../models/Order";
import mongoose from "mongoose";

export const getSessions = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user.id;
    const sessions = await Session.find({ user }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: sessions });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const openSession = async (req: Request, res: Response) => {
  try {
    const { startingBalance } = req.body;
    const userId = (req as any).user.id;

    // 1. Check if user already has an active session
    const activeSession = await Session.findOne({ user: userId, status: "open" });
    if (activeSession) {
      return res.status(400).json({ 
        success: false, 
        message: "You already have an active session open." 
      });
    }

    // 2. Create new session
    const session = new Session({
      user: userId,
      startingBalance: startingBalance || 0,
      status: "open",
      startTime: new Date(),
      totalSales: 0
    });

    await session.save();
    return res.status(201).json({ success: true, session });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Close an active POS session
 */
export const closeSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { endingBalance } = req.body;

    const session = await Session.findById(id);
    if (!session || session.status === "closed") {
      return res.status(400).json({ success: false, message: "Invalid or already closed session" });
    }

    // 1. Calculate summary metrics for the session
    const orders = await Order.find({ session: session._id });
    
    const totalSales = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const orderCount = orders.length;

    // 2. Payment Method Breakdown
    const paymentBreakdown = orders.reduce((acc: any, order) => {
      const method = order.paymentMethod || "other";
      acc[method] = (acc[method] || 0) + (order.totalPrice || 0);
      return acc;
    }, {});

    // 3. Update session
    session.status = "closed";
    session.endTime = new Date();
    session.endingBalance = endingBalance;
    session.totalSales = totalSales;

    await session.save();

    return res.status(200).json({ 
      success: true, 
      session,
      summary: {
        totalSales,
        orderCount,
        paymentBreakdown
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get the currently active session for the user
 */
export const getActiveSession = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user.id;
    const session = await Session.findOne({ user, status: "open" });
    return res.status(200).json({ success: true, session });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get session summary without closing it
 */
export const getSessionSummary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orders = await Order.find({ session: id });
    
    const totalSales = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const orderCount = orders.length;
    const paymentBreakdown = orders.reduce((acc: any, order) => {
      const method = order.paymentMethod || "other";
      acc[method] = (acc[method] || 0) + (order.totalPrice || 0);
      return acc;
    }, {});

    res.json({
      success: true,
      summary: {
        totalSales,
        orderCount,
        paymentBreakdown
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
