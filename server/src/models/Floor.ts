import { Schema, model, Document } from "mongoose";

export interface IFloor extends Document {
  name: string;
  active: boolean;
}

const floorSchema = new Schema<IFloor>(
    {
      name: { type: String, required: true },
      active: { type: Boolean, default: true },
    },
    { timestamps: true }
  );
  
export const Floor = model<IFloor>("Floor", floorSchema);
