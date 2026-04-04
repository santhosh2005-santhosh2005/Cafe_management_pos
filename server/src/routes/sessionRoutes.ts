import { Router } from "express";
import { openSession, closeSession, getActiveSession, getSessions } from "../controllers/session.controller";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authMiddleware, getSessions);
router.post("/open", authMiddleware, openSession);
router.post("/close/:id", authMiddleware, closeSession);
router.get("/active", authMiddleware, getActiveSession);

export default router;
