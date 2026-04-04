import { Navigate, Outlet } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import type { AppDispatch, RootState } from "./store";
import { login, logout } from "./store/userSlice";
import SessionGuard from "./components/SessionGuard";
import { isTokenExpired } from "./utils/token";

export default function ProtectedRoute() {
  const dispatch = useDispatch<AppDispatch>();
  const { token } = useSelector((state: RootState) => state.user);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const restoreSession = () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      
      if (storedToken && storedUser && !isTokenExpired(storedToken)) {
        if (!token) {
          dispatch(
            login({
              token: storedToken,
              ...(JSON.parse(storedUser) || {}),
            })
          );
        }
      } else {
        dispatch(logout());
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
      setIsRestoring(false);
    };

    restoreSession();
  }, [dispatch, token]);

  if (isRestoring) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const validToken =
    token && !isTokenExpired(token) ? token : localStorage.getItem("token");

  if (!validToken || isTokenExpired(validToken)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
