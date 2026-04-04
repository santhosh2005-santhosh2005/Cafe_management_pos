import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";

// -------------------- Super Admin --------------------
export const createSuperAdmin = async (req: Request, res: Response) => {
  try {
    const email = "admin@gmail.com";
    const password = "12345";

    const existing = await User.findOne({ email });
    if (existing) {
      await User.deleteOne({ _id: existing._id });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const superAdmin = new User({
      name: "Super Admin",
      email,
      role: "admin",
      passwordHash: hashedPassword,
      active: true,
      isApproved: true,
    });

    await superAdmin.save();
    res.status(201).json({ message: "Super Admin created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error creating super admin", error });
  }
};

// -------------------- Register User --------------------
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRole = role || "waiter"; // Default to waiter if not specified for safety
    
    // Customers and admins don't need manual approval
    const isApproved = userRole === "admin" || userRole === "customer";
    
    const newUser = new User({
      name,
      email,
      role: userRole,
      passwordHash: hashedPassword,
      active: true,
      isApproved, 
    });

    await newUser.save();
    
    if (isApproved) {
      res.status(201).json({ message: "Registration successful. You can now login." });
    } else {
      res.status(201).json({ message: "User registered successfully. Status: Pending approval." });
    }
  } catch (error) {
    res.status(500).json({ message: "Registration error", error });
  }
};

// -------------------- Login --------------------
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    if (!user.active)
      return res.status(403).json({ message: "Account is deactivated" });

    // Admins bypass approval check to prevent lockout
    if (user.role !== "admin" && !user.isApproved)
      return res.status(403).json({ message: "Account is pending approval from Admin" });

    const isMatch = await bcrypt.compare(password, user.passwordHash || "");
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login error", error });
  }
};

// -------------------- Google Login --------------------
import { OAuth2Client } from "google-auth-library";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID");

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID",
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: "Invalid Google token missing payload/email" });
    }

    const { email, name } = payload;
    let user = await User.findOne({ email });

    // If user does not exist, automatically register them as a customer
    if (!user) {
      const userRole = "customer"; // Normal user
      user = new User({
        name: name || "Google User",
        email,
        role: userRole,
        active: true,
        isApproved: true, // Customers don't need admin approval
      });
      await user.save();
      // Generate initial token for auto-login
      const jwtToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || "secretkey",
        { expiresIn: "7d" }
      );
      return res.json({
        message: "Google Login successful (New Customer)",
        token: jwtToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
        },
      });
    }

    if (!user.active)
      return res.status(403).json({ message: "Account is deactivated" });

    // Admins bypass approval check to prevent lockout
    if (user.role !== "admin" && !user.isApproved)
      return res.status(403).json({ message: "Account is pending approval from Admin" });

    // Generate JWT token for session
    const jwtToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Google Login successful",
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
      },
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(500).json({ message: "Google Login error", error });
  }
};

// -------------------- Staff Management --------------------

// Get all staff
export const getStaffs = async (req: Request, res: Response) => {
  try {
    const admin = await User.find({ role: "admin" });
    const others = await User.find({ role: { $ne: "admin" } });

    // Merge with admin first
    const staffs = [...admin, ...others];

    res.json({ success: true, staffs });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching staff", error });
  }
};

// Add new staff
export const addStaff = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    if (!role) {
      return res
        .status(400)
        .json({ success: false, message: "role is required" });
    }

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password || "12345", 10);

    const staff = new User({
      name,
      email,
      role: role.toLowerCase(),
      passwordHash: hashedPassword,
      active: true,
    });

    await staff.save();
    res.status(201).json({ success: true, staff });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error adding staff", error });
  }
};

// Update staff
export const updateStaff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, active } = req.body;

    const updatedStaff = await User.findByIdAndUpdate(
      id,
      { name, email, role: role?.toLowerCase(), active },
      { new: true }
    );

    if (!updatedStaff)
      return res
        .status(404)
        .json({ success: false, message: "Staff not found" });

    res.json({ success: true, staff: updatedStaff });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error updating staff", error });
  }
};

// Delete staff
export const deleteStaff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedStaff = await User.findByIdAndDelete(id);
    if (!deletedStaff)
      return res
        .status(404)
        .json({ success: false, message: "Staff not found" });

    res.json({ success: true, message: "Staff deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error deleting staff", error });
  }
};

// Toggle active/inactive
export const toggleStaffActive = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const staff = await User.findById(id);
    if (!staff)
      return res
        .status(404)
        .json({ success: false, message: "Staff not found" });

    staff.active = !staff.active;
    await staff.save();

    res.json({ success: true, staff });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error toggling staff status", error });
  }
};

// Admin approve user
export const approveUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { isApproved: true }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, message: "User approved successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Error approving user", error });
  }
};

// Get pending approvals
export const getPendingUsers = async (req: Request, res: Response) => {
  try {
    const pendingUsers = await User.find({ isApproved: false });
    res.json({ success: true, users: pendingUsers });
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending users", error });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error });
  }
};
export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, email, password } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error });
  }
};
