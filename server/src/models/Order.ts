import { Schema, model, Document, Types } from "mongoose";
import { IProduct } from "./Product";
import { ITable } from "./Table";

export interface IOrderItem {
  product: IProduct["_id"];
  quantity: number;
  size: string;
  price: number;
}

export interface IOrder extends Document {
  customOrderID: string;
  items: IOrderItem[];
  totalPrice: number;
  discountPercent?: number;
  taxRate?: number;
  status: "pending" | "preparing" | "ready" | "served" | "cancelled" | "completed";
  paymentMethod: "cash" | "card" | "online" | "upi" | "digital";
  table?: Types.ObjectId | ITable;
  sessionId?: Types.ObjectId;
  responsibleStaff?: Types.ObjectId;
  createdAt: Date;
  updatedAt?: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true },
  size: { type: String, required: true },
  price: { type: Number, required: true },
});

const orderSchema = new Schema<IOrder>(
  {
    customOrderID: { type: String, unique: true },
    items: [orderItemSchema],
    totalPrice: { type: Number, required: true },
    discountPercent: { type: Number, required: true },
    taxRate: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "served", "cancelled", "completed"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "online", "upi", "digital"],
      default: "cash",
    },
    table: { type: Schema.Types.ObjectId, ref: "Table", required: false },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: false },
    responsibleStaff: { type: Schema.Types.ObjectId, ref: "User", required: false },
  },
  { timestamps: true }
);

// Auto-generate customOrderID
orderSchema.pre("save", async function (next) {
  if (!this.customOrderID) {
    const now = new Date();
    const year = now.getFullYear();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");

    const datePrefix = `ORD-${year}-${day}-${month}`;

    // Find last order of the same day
    const lastOrder = await Order.findOne({
      customOrderID: { $regex: `^${datePrefix}` },
    }).sort({ createdAt: -1 });

    let nextNumber = 1;
    if (lastOrder && lastOrder.customOrderID) {
      const parts = lastOrder.customOrderID.split("-");
      const lastNumber = parseInt(parts[4]);
      nextNumber = lastNumber + 1;
    }
    this.customOrderID = `${datePrefix}-${nextNumber}`;
  }
  next();
});

export const Order = model<IOrder>("Order", orderSchema);
