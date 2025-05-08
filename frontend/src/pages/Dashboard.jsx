"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Outlet } from "react-router-dom";
import { clsx } from "@/lib/utils";
import UploadModal from "../components/UploadModal";
import { Link } from "react-router-dom";
import { Home, Compass, Upload, History, Menu } from "lucide-react";
import { useUploadModal } from "../store/modalStore";

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
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-background">
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

      {/* Mobile Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border z-30">
        <div className="flex justify-around items-center h-16">
          <Link
            to="/"
            className="flex flex-col items-center justify-center text-sidebar-foreground p-2"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link
            to="#"
            className="flex flex-col items-center justify-center text-sidebar-foreground p-2"
          >
            <Compass className="h-5 w-5" />
            <span className="text-xs mt-1">Explore</span>
          </Link>
          <button
            onClick={() => useUploadModal.getState().openModal()}
            className="flex flex-col items-center justify-center text-sidebar-foreground p-2"
          >
            <Upload className="h-5 w-5" />
            <span className="text-xs mt-1">Upload</span>
          </button>
          <Link
            to="/dashboard/history"
            className="flex flex-col items-center justify-center text-sidebar-foreground p-2"
          >
            <History className="h-5 w-5" />
            <span className="text-xs mt-1">History</span>
          </Link>
          <button
            onClick={toggleSidebar}
            className="flex flex-col items-center justify-center text-sidebar-foreground p-2"
          >
            <Menu className="h-5 w-5" />
            <span className="text-xs mt-1">Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
