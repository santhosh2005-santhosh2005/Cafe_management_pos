import express from "express";
import { getFloors, createFloor, updateFloor, deleteFloor } from "../controllers/floor.controller";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getFloors);
router.post("/", createFloor);
router.patch("/:id", updateFloor);
router.delete("/:id", deleteFloor);

export default router;
