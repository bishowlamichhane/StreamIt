"use client";

import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { ToastProvider } from "@/components/ToastProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { motion } from "framer-motion";
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

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 1.0 }}
    >
      <ThemeProvider>
        <div className="min-h-screen bg-background text-foreground">
          <ToastProvider />
          <Outlet />
        </div>
      </ThemeProvider>
    </motion.div>
  );
};

export default App;
