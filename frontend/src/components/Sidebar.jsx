"use client";

import {
  Home,
  History,
  LogOut,
  TrendingUpIcon as Trending,
  Clock,
  Settings,
  HelpCircle,
  Menu,
  ChevronLeft,
  Compass,
  Heart,
  Library,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { clsx } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logoutFromServer);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();

  const handleLogout = async () => {
    await logout(); // this is logoutFromServer
    navigate("/login");
  };

  // Replace the menuItems array with this updated version that includes a better message for the Community tab
  const menuItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Compass, label: "Explore", path: "#" },
    {
      icon: Trending,
      label: "Community",
      path: isLoggedIn ? `/community-page/${user?._id}` : "/login",
      onClick: !isLoggedIn
        ? (e) => {
            e.preventDefault();
            // Show a more prominent message
            toast.error("Please login to access community features", {
              description:
                "Community features are only available to logged-in users.",
              duration: 5000,
            });
            navigate("/login", {
              state: {
                from: "community",
                message: "Please login to access community features",
              },
            });
          }
        : undefined,
    },
    { icon: Library, label: "Library", path: "#" },
    { icon: History, label: "History", path: "/dashboard/history" },
    { icon: Clock, label: "Watch Later", path: "#" },
    { icon: Heart, label: "Liked Videos", path: "/dashboard/liked-videos" },
  ];

  const bottomMenuItems = [
    { icon: Settings, label: "Settings", path: "#" },
    { icon: HelpCircle, label: "Help", path: "#" },
  ];

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={toggleSidebar}
        ></div>
      )}

      <aside
        className={clsx(
          "bg-sidebar text-sidebar-foreground border-r border-sidebar-border h-screen transition-all duration-300 fixed z-40 top-0 left-0 flex flex-col",
          isOpen ? "w-64" : "w-16",
          !isOpen && "transform -translate-x-full md:translate-x-0" // Hide on mobile when closed, show on desktop
        )}
      >
        <div className="flex items-center h-16 px-4 border-b border-sidebar-border justify-end">
          {isOpen ? (
            <>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-full hover:bg-sidebar-accent text-sidebar-foreground transition-colors cursor-pointer"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </>
          ) : (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full hover:bg-sidebar-accent text-sidebar-foreground transition-colors mx-auto cursor-pointer"
              aria-label="Expand sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="flex flex-col gap-1 px-2">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                onClick={item.onClick}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  location.pathname === item.path
                    ? "bg-sidebar-accent text-sidebar-primary font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  !isOpen && "justify-center"
                )}
              >
                <item.icon
                  className={clsx(
                    "h-5 w-5 flex-shrink-0",
                    location.pathname === item.path
                      ? "text-sidebar-primary"
                      : "text-sidebar-foreground/70"
                  )}
                />
                {isOpen && <span>{item.label}</span>}
              </Link>
            ))}
          </nav>

          {isOpen && isLoggedIn && (
            <div className="mt-6 pt-6 border-t border-sidebar-border px-2">
              <p className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/70 uppercase">
                Settings
              </p>
              <nav className="flex flex-col gap-1">
                {bottomMenuItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.path}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0 text-sidebar-foreground/70" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Logout Button */}
        {isLoggedIn && (
          <div className="p-4 border-t border-sidebar-border">
            <button
              onClick={handleLogout}
              className={clsx(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors",
                !isOpen && "justify-center cursor-pointer"
              )}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {isOpen && <span>Logout</span>}
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
