import express from "express";
import { getTables, createTable, updateTable, deleteTable, getTableStats, getAssignedTables } from "../controllers/table.Controller";
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Public routes - customers can view tables and stats
router.get("/", getTables);
router.get("/stats", getTableStats);

// Protected routes - only authenticated users can access or modify
router.use(authMiddleware);
router.get("/assigned", getAssignedTables);

router.post("/", adminMiddleware, createTable);
router.patch("/:id", adminMiddleware, updateTable);
router.delete("/:id", adminMiddleware, deleteTable);

export default router;
