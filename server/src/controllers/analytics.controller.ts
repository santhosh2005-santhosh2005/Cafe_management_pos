import { Request, Response } from "express";
import { Order } from "../models/Order";
import mongoose from "mongoose";

/**
 * Helper to get date filter based on type
 */
const getDateFilter = (filter: string, startDate?: string, endDate?: string) => {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  switch (filter) {
    case "daily":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "weekly":
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
      break;
    case "monthly":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "custom":
      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      }
      break;
    default:
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
  }

  return { $gte: start, $lte: end };
};

/**
 * GET /api/analytics/items
 * Insights into which items are selling most
 */
export const getItemAnalytics = async (req: Request, res: Response) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const dateRange = getDateFilter(filter as string, startDate as string, endDate as string);

    const itemSales = await Order.aggregate([
      { $match: { createdAt: dateRange, status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $project: {
          name: "$productInfo.name",
          category: "$productInfo.category",
          totalQuantity: 1,
          totalRevenue: 1,
        },
      },
      { $sort: { totalQuantity: -1 } },
    ]);

    res.json({ success: true, data: itemSales });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/analytics/waiters
 * Insights into waiter performance
 */
export const getWaiterAnalytics = async (req: Request, res: Response) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const dateRange = getDateFilter(filter as string, startDate as string, endDate as string);

    const waiterPerformance = await Order.aggregate([
      { $match: { createdAt: dateRange, status: { $ne: "cancelled" }, waiter: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$waiter",
          orderCount: { $sum: 1 },
          totalSales: { $sum: "$totalPrice" },
          tablesServed: { $addToSet: "$table" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "waiterInfo",
        },
      },
      { $unwind: "$waiterInfo" },
      {
        $project: {
          name: "$waiterInfo.name",
          email: "$waiterInfo.email",
          orderCount: 1,
          totalSales: 1,
          tableCount: { $size: "$tablesServed" },
        },
      },
      { $sort: { totalSales: -1 } },
    ]);

    res.json({ success: true, data: waiterPerformance });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/analytics/dashboard
 * Summary for the admin dashboard
 */
export const getDashboardAnalytics = async (req: Request, res: Response) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const dateRange = getDateFilter(filter as string, startDate as string, endDate as string);

    // 1. Total Revenue & Order Count
    const summary = await Order.aggregate([
      { $match: { createdAt: dateRange, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // 2. Top Selling Item
    const topItem = await Order.aggregate([
      { $match: { createdAt: dateRange, status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          count: { $sum: "$items.quantity" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "info",
        },
      },
      { $unwind: "$info" },
    ]);

    // 3. Top Performing Waiter
    const topWaiter = await Order.aggregate([
      { $match: { createdAt: dateRange, status: { $ne: "cancelled" }, waiter: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$waiter",
          sales: { $sum: "$totalPrice" },
        },
      },
      { $sort: { sales: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "info",
        },
      },
      { $unwind: "$info" },
    ]);

    res.json({
      success: true,
      data: {
        revenue: summary[0]?.totalRevenue || 0,
        orders: summary[0]?.totalOrders || 0,
        topItem: topItem[0] ? { name: topItem[0].info.name, count: topItem[0].count } : null,
        topWaiter: topWaiter[0] ? { name: topWaiter[0].info.name, sales: topWaiter[0].sales } : null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
