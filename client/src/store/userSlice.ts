import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  isLoggedIn: boolean;
  name: string;
  email: string;
  role: "admin" | "staff" | "customer" | "";
  token: string;
  sessionId: string | null;
}

const initialState: UserState = {
  isLoggedIn: false,
  name: "",
  email: "",
  role: "",
  token: "",
  sessionId: localStorage.getItem("sessionId") || null,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login: (
      state,
      action: PayloadAction<{
        name: string;
        email: string;
        role: UserState["role"];
        token: string;
      }>
    ) => {
      state.isLoggedIn = true;
      state.name = action.payload.name;
      state.email = action.payload.email;
      state.role = action.payload.role;
      state.token = action.payload.token;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.name = "";
      state.email = "";
      state.role = "";
      state.token = "";
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("sessionId");
    },
    setSession: (state, action: PayloadAction<string | null>) => {
      state.sessionId = action.payload;
      if (action.payload) {
        localStorage.setItem("sessionId", action.payload);
      } else {
        localStorage.removeItem("sessionId");
      }
    },
  },
});

export const { login, logout, setSession } = userSlice.actions;
export default userSlice.reducer;
