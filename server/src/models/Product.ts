import { Schema, model, Document, Types } from "mongoose";

export interface IVariant {
  attribute: string; // e.g., "Size", "Quantity", "Pack"
  value: string;     // e.g., "Small", "Regular", "6 Items", "12 Items"
  price: number;
}

export interface IProduct extends Document {
  name: string;
  category: Types.ObjectId;
  description?: string;
  imageUrl?: string;
  available: boolean;
  unit: string;      // e.g. "pcs", "kg", "ml"
  taxRate: number;   // e.g. 5 for 5%
  basePrice: number; // Base price if no variant is selected
  variants: IVariant[];
}

const variantSchema = new Schema<IVariant>({
  attribute: { type: String, required: true },
  value: { type: String, required: true },
  price: { type: Number, required: true },
});

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    description: { type: String },
    imageUrl: { type: String },
    available: { type: Boolean, default: true },
    unit: { type: String, default: "pcs" },
    taxRate: { type: Number, default: 0 },
    basePrice: { type: Number, required: true, default: 0 },
    variants: [variantSchema],
  },
  { timestamps: true }
);

export const Product = model<IProduct>("Product", productSchema);
