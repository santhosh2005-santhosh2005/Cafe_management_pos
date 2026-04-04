import { Router } from "express";
import { getItemAnalytics, getWaiterAnalytics, getDashboardAnalytics, getCashierAnalytics } from "../controllers/analytics.controller";
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware";

const router = Router();

// 🎯 Insight Generator Endpoints
// Authenticated routes to ensure only authorized users access analytics

router.get("/items", authMiddleware, adminMiddleware, getItemAnalytics);
router.get("/waiters", authMiddleware, adminMiddleware, getWaiterAnalytics);
router.get("/dashboard", authMiddleware, adminMiddleware, getDashboardAnalytics);
router.get("/cashiers", authMiddleware, adminMiddleware, getCashierAnalytics);

export default router;
