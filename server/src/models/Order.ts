import { Schema, model, Document, Types } from "mongoose";
import { IProduct } from "./Product";
import { ITable } from "./Table";

export interface IOrderItem {
  product: IProduct["_id"];
  quantity: number;
  size: string;
  price: number;
  discount?: number;
  taxRate?: number;
  itemStatus: "pending" | "preparing" | "unavailable" | "completed";
}

export interface IOrder extends Document {
  customOrderID: string;
  items: IOrderItem[];
  totalPrice: number;
  discountPercent?: number;
  taxRate?: number;
  status: "draft" | "pending" | "preparing" | "ready" | "served" | "cancelled" | "completed";
  paymentMethod: "cash" | "card" | "online" | "upi" | "digital";
  isCustomerOrder?: boolean;
  waiterConfirmed?: boolean;
  table?: Types.ObjectId | ITable;
  sessionId?: Types.ObjectId;
  responsibleStaff?: Types.ObjectId;
  cashierId?: Types.ObjectId;
  priorityScore: number;
  priorityLevel: "high" | "medium" | "low";
  isPriorityBoosted?: boolean;
  estimatedTime?: number;
  confirmedTime?: number;
  timeConfirmedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true },
  size: { type: String, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  itemStatus: {
    type: String,
    enum: ["pending", "preparing", "unavailable", "completed"],
    default: "pending",
  },
});

const orderSchema = new Schema<IOrder>(
  {
    customOrderID: { type: String, unique: true },
    items: [orderItemSchema],
    totalPrice: { type: Number, required: true },
    discountPercent: { type: Number, required: true, default: 0 },
    taxRate: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["draft", "pending", "preparing", "ready", "served", "cancelled", "completed"],
      default: "pending",
    },
    isCustomerOrder: { type: Boolean, default: false },
    waiterConfirmed: { type: Boolean, default: false },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "online", "upi", "digital"],
      default: "cash",
    },
    table: { type: Schema.Types.ObjectId, ref: "Table", required: false },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: false },
    responsibleStaff: { type: Schema.Types.ObjectId, ref: "User", required: false },
    cashierId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    // ── SMART PRIORITY FIELDS ────────────────────────────────────────────────
    priorityScore: { type: Number, default: 0 },
    priorityLevel: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "low",
    },
    isPriorityBoosted: { type: Boolean, default: false },
    // ── WAIT-TIME ESTIMATION FIELDS ──────────────────────────────────────────
    estimatedTime: { type: Number, default: 0 },
    confirmedTime: { type: Number, default: 0 },
    timeConfirmedAt: { type: Date },
  },
  { timestamps: true }
);

// Auto-generate customOrderID
orderSchema.pre("save", async function (next) {
  const doc = this as any;
  if (!doc.customOrderID) {
    const now = new Date();
    const year = now.getFullYear();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");

    const datePrefix = `ORD-${year}-${day}-${month}`;

    // Find last order of the same day
    const lastOrder = await (this.constructor as any).findOne({
      customOrderID: { $regex: `^${datePrefix}` },
    }).sort({ createdAt: -1 });

    let nextNumber = 1;
    if (lastOrder && lastOrder.customOrderID) {
      const parts = lastOrder.customOrderID.split("-");
      const lastNumber = parseInt(parts[4]);
      nextNumber = lastNumber + 1;
    }
    doc.customOrderID = `${datePrefix}-${nextNumber}`;
  }
  next();
});

export const Order = model<IOrder>("Order", orderSchema);
