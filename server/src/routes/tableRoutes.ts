import express from "express";
import { getTables, createTable, updateTable, deleteTable } from "../controllers/table.Controller";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getTables);
router.post("/", createTable);
router.patch("/:id", updateTable);
router.delete("/:id", deleteTable);

export default router;
