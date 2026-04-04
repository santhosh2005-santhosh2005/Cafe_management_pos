import express from "express";
import { getTables, createTable, updateTable, deleteTable, getTableStats, getAssignedTables } from "../controllers/table.Controller";
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getTables);
router.get("/stats", getTableStats);
router.get("/assigned", getAssignedTables);

router.post("/", adminMiddleware, createTable);
router.patch("/:id", adminMiddleware, updateTable);
router.delete("/:id", adminMiddleware, deleteTable);

export default router;
