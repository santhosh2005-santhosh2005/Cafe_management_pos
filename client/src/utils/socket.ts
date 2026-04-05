import { io } from "socket.io-client";

const apiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5001";
export const socket = io(apiUrl, {
  withCredentials: true,
});
