"use client";

import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, Bell, Sun, Moon, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import API from "../api";
import { clsx } from "@/lib/utils";
import { useUploadModal } from "../store/modalStore";

export default function Header() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const userNameElement = useRef(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchUser = async (e) => {
    e.preventDefault();
    const username = userNameElement.current.value.trim();
    if (!username) return;

    navigate(`/dashboard/search?query=${username}`);
  };

  const goToChannel = () => {
    if (user?.username) {
      navigate(`/dashboard/channel/${user?.username}/${user?._id}`);
    }
  };

  return (
    <header className="flex items-center justify-between h-16 px-4 border-b bg-background border-border">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-foreground">🎬 StreamIt</h1>
        </Link>
      </div>

      <form
        onSubmit={searchUser}
        className={clsx(
          "relative max-w-xl w-full mx-4 transition-all duration-200",
          isSearchFocused ? "md:scale-105" : ""
        )}
      >
        <div className="relative">
          <Input
            type="text"
            placeholder="Search channels or videos..."
            className="w-full pl-10 pr-12 py-2 bg-muted border-none focus:ring-2 focus:ring-primary text-foreground"
            ref={userNameElement}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 " />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-primary-foreground px-2 py-1 rounded text-sm cursor-pointer hover:bg-primary/90 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      <div className="flex items-center gap-3">
        <button
          className="p-2 rounded-full hover:bg-muted transition-colors cursor-pointer"
          aria-label="Toggle theme"
        >
          <Sun className="h-5 w-5 text-foreground" />
        </button>

        {isLoggedIn ? (
          <div className="flex items-center gap-3">
            {/* Upload Video Button - New Addition */}
            <button
              className="p-2 rounded-full hover:bg-muted transition-colors relative cursor-pointer"
              aria-label="Upload video"
              title="Upload video"
              onClick={() => useUploadModal.getState().openModal()}
            >
              <Upload className="h-5 w-5 text-foreground" />
            </button>

            <button className="p-2 rounded-full hover:bg-muted transition-colors relative cursor-pointer">
              <Bell className="h-5 w-5 text-foreground" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full"></span>
            </button>

            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={goToChannel}
            >
              <div className="hidden md:block">
                <p className="text-sm font-medium text-foreground">
                  {user?.fullName || user?.username}
                </p>
                <p className="text-xs text-muted-foreground">
                  @{user?.username}
                </p>
              </div>
              <Avatar className="h-9 w-9 border-2 border-background">
                <AvatarImage
                  src={user?.avatar || "/placeholder.jpg"}
                  alt={user?.username}
                />
                <AvatarFallback>
                  {user?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-primary hover:underline">
              Login
            </Link>
            <Link
              to="/register"
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
