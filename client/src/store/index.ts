import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import { staffApi } from "@/services/staffService";
import { categoryApi } from "@/services/categoryApi";
import { productApi } from "@/services/productApi";
import cartReducer from "./cartSlice";
import { orderApi } from "@/services/orderApi";
import { userApi } from "@/services/userApi";
import { settingsApi } from "@/services/SettingsApi";
import { tableApi } from "@/services/tableApi";
import { floorApi } from "@/services/floorApi";
import { sessionApi } from "@/services/sessionApi";

export const store = configureStore({
  reducer: {
    user: userReducer,
    cart: cartReducer,
    [orderApi.reducerPath]: orderApi.reducer,
    [staffApi.reducerPath]: staffApi.reducer,
    [categoryApi.reducerPath]: categoryApi.reducer,
    [productApi.reducerPath]: productApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
    [tableApi.reducerPath]: tableApi.reducer,
    [floorApi.reducerPath]: floorApi.reducer,
    [sessionApi.reducerPath]: sessionApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(staffApi.middleware)
      .concat(categoryApi.middleware)
      .concat(orderApi.middleware)
      .concat(userApi.middleware)
      .concat(settingsApi.middleware)
      .concat(productApi.middleware)
      .concat(tableApi.middleware)
      .concat(floorApi.middleware)
      .concat(sessionApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
