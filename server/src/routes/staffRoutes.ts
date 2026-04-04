// routes/staffRoutes.ts
import { Router } from "express";
import { assignTableWaiter, getMyTables, getKitchenLoad } from "../controllers/staff.Controller";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// @route   PUT /api/staff/assign-table
router.put("/assign-table", authMiddleware, assignTableWaiter);

// @route   GET /api/staff/my-tables
router.get("/my-tables", authMiddleware, getMyTables);

// @route   GET /api/staff/kitchen-load
router.get("/kitchen-load", getKitchenLoad);

export default router;
