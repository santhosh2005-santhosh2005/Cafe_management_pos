import { Schema, model, Document } from "mongoose";

// ======================
// 1️⃣ Pure TypeScript Interface (plain object type)
// ======================
export interface IBusinessSettings {
  // 🧾 Finance
  taxRate: number;
  discountRate: number;
  currency: string;
  serviceCharge?: number;
  
  // 💸 Payment Methods
  allowCash: boolean;
  allowDigital: boolean;
  allowUPI: boolean;
  upiId: string;
  razorpayKeyId?: string; // Standard for Merchant Onboarding
  razorpayKeySecret?: string; // Standard for Server-side verification

  // 🏢 Business Info
  businessName: string;
  address: string;
  phone: string;
  email?: string;
  website?: string;

  // 🖨️ Printing
  receiptFooter?: string;
  logoUrl?: string;
  showTableName?: boolean;

  // ⚙️ POS Behavior
  enableDiscountInput: boolean;
  enableTaxOverride: boolean;
  allowNegativeStock: boolean;

  // 🕒 Shifts & Timing
  openingTime?: string; // e.g. "09:00"
  closingTime?: string; // e.g. "23:00"
  offDays?: string[]; // e.g. ["Friday"]

  // 📊 Reports
  lowStockAlertLevel?: number;
  salesTarget?: number;

  updatedAt?: Date;
}

// ======================
// 2️⃣ Mongoose Interface (extends Document)
// ======================
export interface BusinessSettingsDocument extends IBusinessSettings, Document {}

// ======================
// 3️⃣ Mongoose Schema
// ======================
const settingSchema = new Schema<BusinessSettingsDocument>(
  {
    // 🧾 Finance
    taxRate: { type: Number, required: true, default: 0 },
    discountRate: { type: Number, required: true, default: 0 },
    currency: { type: String, required: true, default: "BDT" },
    serviceCharge: { type: Number, default: 0 },

    // 💸 Payment Methods
    allowCash: { type: Boolean, default: true },
    allowDigital: { type: Boolean, default: true },
    allowUPI: { type: Boolean, default: true },
    upiId: { type: String, default: "123@ybl" },
    razorpayKeyId: { type: String },


    // 🏢 Business Info
    businessName: { type: String, required: true, default: "Odoo POS Cafe" },
    address: { type: String, required: true, default: "Ahmedabad, India" },
    phone: { type: String, required: true, default: "+91-9876543210" },
    email: { type: String },
    website: { type: String },

    // 🖨️ Printing
    receiptFooter: {
      type: String,
      default: "Thank you for visiting Odoo POS Cafe!",
    },
    logoUrl: { type: String },
    showTableName: { type: Boolean, default: true },

    // ⚙️ POS Behavior
    enableDiscountInput: { type: Boolean, default: true },
    enableTaxOverride: { type: Boolean, default: false },
    allowNegativeStock: { type: Boolean, default: false },

    // 🕒 Shifts & Timing
    openingTime: { type: String, default: "09:00" },
    closingTime: { type: String, default: "23:00" },
    offDays: { type: [String], default: ["Friday"] },

    // 📊 Reports
    lowStockAlertLevel: { type: Number, default: 5 },
    salesTarget: { type: Number, default: 10000 },
  },
  { timestamps: true }
);

// ======================
// 4️⃣ Mongoose Model
// ======================
export const SettingModel = model<BusinessSettingsDocument>(
  "Setting",
  settingSchema
);

// ======================
// 5️⃣ Default Settings (plain object)
// ======================
export const defaultSettings: IBusinessSettings = {
  taxRate: 5,
  discountRate: 0,
  currency: "BDT",
  serviceCharge: 0,
  
  allowCash: true,
  allowDigital: true,
  allowUPI: true,
  upiId: "charanb9880@oksbi",
  razorpayKeyId: "rzp_test_SZJmomsU0llCUC",
  razorpayKeySecret: "YZxwqAaSKfCYeiw62T40ug4a",

  businessName: "Odoo POS Cafe",
  address: "Ahmedabad, India",
  phone: "+91-9876543210",
  website: "https://odoo.com",
  receiptFooter: "Thank you for visiting Odoo POS Cafe!",

  enableDiscountInput: true,
  enableTaxOverride: false,
  allowNegativeStock: false,

  openingTime: "00:00",
  closingTime: "23:59",
  offDays: [],

  lowStockAlertLevel: 5,
  salesTarget: 10000,
  updatedAt: new Date(),
};
