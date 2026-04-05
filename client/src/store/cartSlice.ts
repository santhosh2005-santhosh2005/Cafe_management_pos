// store/orderSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface OrderItem {
  lineId: string;
  productId: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  discount?: number;
  taxRate?: number;
}

interface OrderState {
  items: OrderItem[];
  totalPrice: number;
}

const initialState: OrderState = {
  items: [],
  totalPrice: 0,
};

const cartSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<Omit<OrderItem, "lineId">>) => {
      // Generate a unique lineId for this item
      const lineId = `${action.payload.productId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      state.items.push({ ...action.payload, lineId, quantity: 1 });

      // Recalculate total price
      state.totalPrice = state.items.reduce(
        (sum, item) => sum + (item.price * (1 - (item.discount || 0) / 100)) * item.quantity,
        0
      );
    },

    removeItem: (
      state,
      action: PayloadAction<{ lineId: string }>
    ) => {
      state.items = state.items.filter((item) => item.lineId !== action.payload.lineId);

      state.totalPrice = state.items.reduce(
        (sum, item) => sum + (item.price * (1 - (item.discount || 0) / 100)) * item.quantity,
        0
      );
    },

    clearCart: (state) => {
      state.items = [];
      state.totalPrice = 0;
    },

    setCart: (state, action: PayloadAction<OrderItem[]>) => {
      state.items = action.payload;
      state.totalPrice = state.items.reduce(
        (sum, item) => sum + (item.price * (1 - (item.discount || 0) / 100)) * item.quantity,
        0
      );
    },

    updateQuantity: (
      state,
      action: PayloadAction<{
        lineId: string;
        quantity: number;
      }>
    ) => {
      const { lineId, quantity } = action.payload;
      const item = state.items.find((i) => i.lineId === lineId);
      if (item) {
        item.quantity = quantity;
      }

      state.totalPrice = state.items.reduce(
        (sum, item) => sum + (item.price * (1 - (item.discount || 0) / 100)) * item.quantity,
        0
      );
    },

    updateItemField: (
      state,
      action: PayloadAction<{
        lineId: string;
        field: "quantity" | "price" | "discount";
        value: number;
      }>
    ) => {
      const { lineId, field, value } = action.payload;
      const item = state.items.find((i) => i.lineId === lineId);
      if (item) {
        (item as any)[field] = value;
      }

      state.totalPrice = state.items.reduce(
        (sum, item) => sum + (item.price * (1 - (item.discount || 0) / 100)) * item.quantity,
        0
      );
    },
  },
});

export const { addItem, removeItem, clearCart, updateQuantity, updateItemField, setCart } = cartSlice.actions;
export default cartSlice.reducer;
