"use client";

import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { ToastProvider } from "@/components/ToastProvider";

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const initialAuthentication = useAuthStore(
    (state) => state.initialAuthentication
  );

  useEffect(() => {
    initialAuthentication(); // Check login status on load
  }, []);

  // Optional: redirect to /dashboard if user logs in from login/register
  useEffect(() => {
    if (
      isLoggedIn &&
      (location.pathname === "/login" || location.pathname === "/register")
    ) {
      navigate("/dashboard");
    }
  }, [isLoggedIn, location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ToastProvider />
      <Outlet />
    </div>
  );
};

export default App;
