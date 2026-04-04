import { Router } from "express";
import { openSession, closeSession, getActiveSession, getSessions, getSessionSummary } from "../controllers/session.controller";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authMiddleware, getSessions);
router.post("/open", authMiddleware, openSession);
router.post("/close/:id", authMiddleware, closeSession);
router.get("/active", authMiddleware, getActiveSession);
router.get("/summary/:id", authMiddleware, getSessionSummary);

export default router;
