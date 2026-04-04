import { Router } from "express";
import { openSession, closeSession, getActiveSession } from "../controllers/session.controller";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post("/open", authMiddleware, openSession);
router.post("/close/:id", authMiddleware, closeSession);
router.get("/active", authMiddleware, getActiveSession);

export default router;
