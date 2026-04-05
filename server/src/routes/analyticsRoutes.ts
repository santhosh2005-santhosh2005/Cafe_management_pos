import { Router } from "express";
import { 
  getItemAnalytics, 
  getWaiterAnalytics, 
  getDashboardAnalytics, 
  getCashierAnalytics,
  getPeakHoursAnalytics,
  getBestItemsAnalytics,
  getSalesTrendsAnalytics,
  getOrderTimeAnalytics,
  getOverviewAnalytics,
  getTimeBasedItemAnalytics
} from "../controllers/analytics.controller";
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware";

const router = Router();

// 🎯 Insight Generator Endpoints
// Authenticated routes to ensure only authorized users access analytics

router.get("/overview", authMiddleware, adminMiddleware, getOverviewAnalytics);
router.get("/sales-trends", authMiddleware, adminMiddleware, getSalesTrendsAnalytics);
router.get("/staff", authMiddleware, adminMiddleware, getWaiterAnalytics);
router.get("/items", authMiddleware, adminMiddleware, getItemAnalytics);
router.get("/time", authMiddleware, adminMiddleware, getPeakHoursAnalytics);
router.get("/time-based-items", authMiddleware, adminMiddleware, getTimeBasedItemAnalytics);

router.get("/dashboard", authMiddleware, adminMiddleware, getDashboardAnalytics);
router.get("/cashiers", authMiddleware, adminMiddleware, getCashierAnalytics);
router.get("/peak-hours", authMiddleware, adminMiddleware, getPeakHoursAnalytics);
router.get("/best-items", authMiddleware, adminMiddleware, getBestItemsAnalytics);
router.get("/waiter-performance", authMiddleware, adminMiddleware, getWaiterAnalytics); 
router.get("/order-time", authMiddleware, adminMiddleware, getOrderTimeAnalytics);

export default router;
