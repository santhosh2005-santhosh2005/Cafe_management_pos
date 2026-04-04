import { Schema, model, Document, Types } from "mongoose";

export interface ITable extends Document {
  number: string;
  seats: number;
  status: "free" | "occupied";
  active: boolean;
  floor: Types.ObjectId;
  appointmentResourceId?: string; // Resource identification for appointments
}

const tableSchema = new Schema<ITable>(
  {
    number: { type: String, required: true },
    seats: { type: Number, required: true, default: 2 },
    status: { type: String, enum: ["free", "occupied"], default: "free" },
    active: { type: Boolean, default: true },
    floor: { type: Schema.Types.ObjectId, ref: "Floor", required: true },
    appointmentResourceId: { type: String },
  },
  { timestamps: true }
);

export const Table = model<ITable>("Table", tableSchema);
