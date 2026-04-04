import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import App from "./App";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import "./index.css";
import Login from "./pages/Login";
import { Provider } from "react-redux";
import { store } from "./store";
import { ThemeProvider } from "./components/theme-provider";
import Dashboard from "./dashboard/Dashboard";
import DashboardHome from "./dashboard/DashboardHome";
import ProtectedRoute from "./ProtectedRoute";
import { Toaster } from "react-hot-toast";
import StaffManagement from "./dashboard/staff/StaffManagement";
import CategoryManagement from "./dashboard/category/CategoryManagement";
import ProductManagement from "./dashboard/product/ProductManagement";
import OrdersList from "./pages/OrderList";
import ProfilePage from "./pages/ProfilePage";
import SummaryManagement from "./pages/SummaryManagement";
import { SettingManagement } from "./pages/SettingManagement";
import MainNavbar from "./components/MainNavbar";
import Register from "./pages/Register";
import KitchenDisplay from "./pages/KitchenDisplay";
import MainPage from "./pages/MainPage";
import FloorManagement from "./dashboard/floor/FloorManagement";
import POSPortal from "./pages/POSPortal";
import SelfOrdering from "./pages/SelfOrdering";
import StaffDashboard from "./pages/StaffDashboard";
import CustomerDisplay from "./pages/CustomerDisplay";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";

import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "your-google-client-id";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <Provider store={store}>
          <BrowserRouter>
            <MainNavbar />
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/about" element={<About />} />
              <Route path="/self-order/:tableId" element={<SelfOrdering />} />
              <Route path="/customer-display" element={<CustomerDisplay />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />}>
                  <Route index element={<DashboardHome />} />
                  <Route path="analytics" element={<AdvancedAnalytics />} />
                  <Route path="floor" element={<FloorManagement />} />
                  <Route path="staff" element={<StaffManagement />} />
                  <Route path="categories" element={<CategoryManagement />} />
                  <Route path="orders" element={<OrdersList />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="menu" element={<ProductManagement />} />
                  <Route path="pos" element={<POSPortal />} />
                  <Route path="pos/terminal" element={<MainPage />} />
                  <Route path="reports" element={<SummaryManagement />} />
                  <Route path="waiter-station" element={<StaffDashboard />} />
                  <Route path="settings" element={<SettingManagement />} />
                  <Route path="kitchen" element={<KitchenDisplay />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster position="top-center" reverseOrder={false} />
          </BrowserRouter>
        </Provider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
