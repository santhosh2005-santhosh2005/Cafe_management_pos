import { Router } from "express";
import {
  createSuperAdmin,
  loginUser,
  registerUser,
  addStaff,
  getStaffs,
  updateStaff,
  toggleStaffActive,
  deleteStaff,
  getUserProfile,
  updateUserProfile,
  approveUser,
  getPendingUsers,
  googleLogin,
} from "../controllers/user.controller";
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/superadmin", createSuperAdmin);

// Auth
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google-login", googleLogin);

// Admin Management
router.get("/staff", authMiddleware, adminMiddleware, getStaffs);
router.post("/staff", authMiddleware, adminMiddleware, addStaff);
router.put("/staff/:id", authMiddleware, adminMiddleware, updateStaff);
router.patch("/staff/:id/active", authMiddleware, adminMiddleware, toggleStaffActive);
router.delete("/staff/:id", authMiddleware, adminMiddleware, deleteStaff);
router.get("/pending", authMiddleware, adminMiddleware, getPendingUsers);
router.patch("/approve/:id", authMiddleware, adminMiddleware, approveUser);

router.get("/profile", authMiddleware, getUserProfile);
router.put("/profile", authMiddleware, updateUserProfile);
export default router;
