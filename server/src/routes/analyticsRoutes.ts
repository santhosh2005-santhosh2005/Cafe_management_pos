import { Router } from "express";
import { getItemAnalytics, getWaiterAnalytics, getDashboardAnalytics } from "../controllers/analytics.controller";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// 🎯 Insight Generator Endpoints
// Authenticated routes to ensure only authorized users access analytics

router.get("/items", authMiddleware, getItemAnalytics);
router.get("/waiters", authMiddleware, getWaiterAnalytics);
router.get("/dashboard", authMiddleware, getDashboardAnalytics);

export default router;
