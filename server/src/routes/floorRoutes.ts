import express from "express";
import { getFloors, createFloor, updateFloor, deleteFloor } from "../controllers/floor.controller";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Public routes - customers can view floors
router.get("/", getFloors);

// Protected routes - only authenticated users can modify
router.use(authMiddleware);
router.post("/", createFloor);
router.patch("/:id", updateFloor);
router.delete("/:id", deleteFloor);

export default router;
