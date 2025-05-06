"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Outlet } from "react-router-dom";
import { clsx } from "@/lib/utils";
import UploadModal from "../components/UploadModal";

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Closed by default
  const { loading } = useAuthStore();

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div
        className={clsx(
          "flex flex-col flex-1 w-full transition-all duration-300",
          isSidebarOpen ? "md:ml-64" : "md:ml-16"
        )}
      >
        <Header />
        <UploadModal />
        <main className="flex-1 overflow-auto p-6 bg-background">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin mb-4"></div>
                <span className="text-muted-foreground">
                  Loading your dashboard...
                </span>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
