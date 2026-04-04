import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  role: "admin" | "staff" | "customer" | "cashier" | "manager" | "waiter";
  position?: "manager" | "cashier" | "waiter"; // for staff
  phone?: string;
  passwordHash?: string;
  active: boolean; // to manage active/inactive
  isApproved: boolean; // for admin approval flow
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ["admin", "staff", "customer", "cashier", "manager", "waiter"],
      default: "customer",
    },
    position: {
      type: String,
      enum: ["manager", "cashier", "waiter"],
    },
    phone: { type: String },
    passwordHash: { type: String },
    active: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
