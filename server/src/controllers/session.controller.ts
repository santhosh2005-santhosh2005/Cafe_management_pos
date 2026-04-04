import { Request, Response } from "express";
import { Session } from "../models/Session";
import { Order } from "../models/Order";

export const openSession = async (req: Request, res: Response) => {
  try {
    const { startingBalance } = req.body;
    const user = (req as any).user.id;

    // Check for an active session
    const activeSession = await Session.findOne({ user, status: "open" });
    if (activeSession) {
      return res.status(400).json({ success: false, message: "User already has an active session" });
    }

    const session = new Session({
      user,
      startingBalance,
      status: "open",
    });

    await session.save();
    return res.status(201).json({ success: true, session });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const closeSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { endingBalance } = req.body;

    const session = await Session.findById(id);
    if (!session || session.status === "closed") {
      return res.status(400).json({ success: false, message: "Invalid or already closed session" });
    }

    // Calculate total sales for the session duration
    const sales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: session.startTime, $lte: new Date() },
          // status: "paid" // Assuming sessions only track completed sales
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
        },
      },
    ]);

    const totalSales = sales.length > 0 ? sales[0].total : 0;

    session.status = "closed";
    session.endTime = new Date();
    session.endingBalance = endingBalance;
    session.totalSales = totalSales;

    await session.save();
    return res.status(200).json({ success: true, session });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getActiveSession = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user._id;
    const session = await Session.findOne({ user, status: "open" });
    return res.status(200).json({ success: true, session });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
