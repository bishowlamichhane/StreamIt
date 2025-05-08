"use client";

import { useAuthStore } from "@/store/authStore";
import { useState, useEffect } from "react";
import {
  TrendingUp,
  ChevronRight,
  Play,
  Music,
  Gamepad2,
  Lightbulb,
  Film,
  Trophy,
  Laptop,
  Newspaper,
  Sparkles,
  Filter,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import API from "../api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useToast } from "@/hooks/use-toast";
import { clsx } from "@/lib/utils";

dayjs.extend(relativeTime);

const DashboardHome = () => {
  const { user, isLoggedIn } = useAuthStore();
  const [categories] = useState([
    { id: 1, name: "Music", icon: Music, color: "text-pink-500" },
    { id: 2, name: "Gaming", icon: Gamepad2, color: "text-purple-500" },
    { id: 3, name: "Education", icon: Lightbulb, color: "text-blue-500" },
    { id: 4, name: "Entertainment", icon: Film, color: "text-red-500" },
    { id: 5, name: "Sports", icon: Trophy, color: "text-green-500" },
    { id: 7, name: "Tech", icon: Laptop, color: "text-indigo-500" },
    { id: 8, name: "News", icon: Newspaper, color: "text-yellow-500" },
    { id: 9, name: "Howto", icon: Sparkles, color: "text-orange-500" },
  ]);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const toast = useToast();

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const res = await API.get("/v1/videos/random-videos");
        const fetchedVideos = res.data.data || [];
        setVideos(fetchedVideos);
        setFilteredVideos(fetchedVideos);
      } catch (err) {
        console.log("Failed to load videos ", err);
        toast.error("Failed to load videos");
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const handleCategoryClick = (categoryName) => {
    if (selectedCategory === categoryName) {
      // If clicking the already selected category, clear the filter
      setSelectedCategory(null);
      setFilteredVideos(videos);
    } else {
      // Otherwise, filter by the selected category
      setSelectedCategory(categoryName);
      const filtered = videos.filter(
        (video) => video?.category?.toLowerCase() === categoryName.toLowerCase()
      );
      setFilteredVideos(filtered);

      if (filtered.length === 0) {
        toast.info(`No videos found in the ${categoryName} category`);
      }
    }
  };

  const clearCategoryFilter = () => {
    setSelectedCategory(null);
    setFilteredVideos(videos);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
        <h2 className="text-2xl font-bold mb-2">
          {isLoggedIn
            ? `Welcome back, ${user?.fullName || "User"}`
            : "Welcome to StreamIt"}
        </h2>
        <p className="text-muted-foreground mb-4">
          {isLoggedIn
            ? "Your personalized streaming experience awaits"
            : "Sign in to get a personalized experience and start uploading videos"}
        </p>
        {!isLoggedIn && (
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>
        )}
      </div>

      {/* Categories Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Browse Categories</h2>
          <Link
            to="#"
            className="text-primary hover:underline flex items-center text-sm"
          >
            See all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.name)}
              className={clsx(
                "bg-card hover:bg-accent rounded-lg p-3 text-center transition-colors group cursor-pointer",
                selectedCategory === category.name
                  ? "border-2 border-primary"
                  : "border border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-center justify-center h-10 mb-2">
                <category.icon
                  className={clsx(
                    "w-6 h-6 stroke-[1.5px]",
                    selectedCategory === category.name
                      ? "text-primary"
                      : category.color
                  )}
                />
              </div>
              <div
                className={clsx(
                  "text-sm font-medium transition-colors",
                  selectedCategory === category.name
                    ? "text-primary"
                    : "group-hover:text-primary"
                )}
              >
                {category.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recommended Videos */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              {selectedCategory
                ? `${selectedCategory} Videos`
                : "Recommended for you"}
            </h2>
            {selectedCategory && (
              <button
                onClick={clearCategoryFilter}
                className="ml-3 flex items-center text-sm bg-muted px-2 py-1 rounded-full hover:bg-accent transition-colors"
              >
                <X className="h-3 w-3 mr-1" />
                Clear filter
              </button>
            )}
          </div>
          <Link
            to="#"
            className="text-primary hover:underline flex items-center text-sm"
          >
            See all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {filteredVideos.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-2">No videos found</h3>
            <p className="text-muted-foreground mb-4">
              {selectedCategory
                ? `We couldn't find any videos in the ${selectedCategory} category.`
                : "We couldn't find any videos matching your criteria."}
            </p>
            {selectedCategory && (
              <button
                onClick={clearCategoryFilter}
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Show all videos
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredVideos.map((video) => (
              <div
                key={video._id}
                className="bg-card rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
              >
                <Link to={`/video/${video._id}`}>
                  <div className="aspect-video bg-muted relative group">
                    <img
                      src={video.thumbnail || "/placeholder-video.jpg"}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-1 py-0.5 rounded">
                      {formatDuration(video.duration)}
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white bg-opacity-90 rounded-full p-3">
                        <Play className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="p-3">
                  <Link to={`/video/${video._id}`}>
                    <h3 className="font-medium line-clamp-2 hover:text-primary transition-colors">
                      {video.title}
                    </h3>
                  </Link>

                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-muted-foreground">
                      {video.views} views • {dayjs(video.createdAt).fromNow()}
                    </p>
                    {video.category && (
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                        {video.category}
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/dashboard/channel/${video.owner?.username}/${video.owner?._id}`}
                    className="flex items-center gap-2 mt-2"
                  >
                    <img
                      src={video.owner?.avatar || "/placeholder.jpg"}
                      className="w-6 h-6 rounded-full"
                      alt="avatar"
                    />
                    <p className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {video.owner?.username}
                    </p>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;
