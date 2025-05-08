"use client";

import { useEffect, useState } from "react";
import API from "@/api";
import {
  Grid,
  List,
  SortAsc,
  Filter,
  Clock,
  Eye,
  Calendar,
  Search,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Link, useParams } from "react-router-dom";
dayjs.extend(relativeTime);

export default function ChannelVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [searchQuery, setSearchQuery] = useState("");
  const user = useAuthStore((state) => state.user);
  const { username } = useParams();
  const { id } = useParams();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        // In a real app, you might want to fetch videos for a specific channel
        // For now, we're just getting all videos
        const res = await API.get(`/v1/videos/get-videos/${id}`);
        setVideos(res.data.data || []);
      } catch (err) {
        console.error("Error fetching videos", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [username]);

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const filteredVideos = videos.filter((video) =>
    video.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg overflow-hidden">
            <div className="aspect-video bg-gray-300"></div>
            <div className="p-3">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold">Videos</h2>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>

          <div className="flex items-center gap-1 border rounded-lg overflow-hidden">
            <button
              className={`p-2 ${
                viewMode === "grid"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-white hover:bg-gray-100"
              }`}
              onClick={() => setViewMode("grid")}
              title="Grid view"
            >
              <Grid size={18} />
            </button>
            <button
              className={`p-2 ${
                viewMode === "list"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-white hover:bg-gray-100"
              }`}
              onClick={() => setViewMode("list")}
              title="List view"
            >
              <List size={18} />
            </button>
          </div>

          <button
            className="p-2 border rounded-lg bg-white hover:bg-gray-100"
            title="Sort videos"
          >
            <SortAsc size={18} />
          </button>
          <button
            className="p-2 border rounded-lg bg-white hover:bg-gray-100"
            title="Filter videos"
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      {filteredVideos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <Grid className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No videos found
          </h3>
          <p className="text-gray-500">
            {searchQuery
              ? `No videos matching "${searchQuery}"`
              : "This channel hasn't uploaded any videos yet"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVideos.map((video) => (
            <Link
              to={`/video/${video._id}`}
              key={video._id}
              className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
            >
              <div className="aspect-video bg-gray-200 relative">
                <img
                  src={
                    video.thumbnail || "/placeholder.svg?height=720&width=1280"
                  }
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-1.5 py-0.5 rounded">
                  {formatDuration(video.duration)}
                </div>
              </div>

              <div className="p-3">
                <h3 className="font-medium bg-muted line-clamp-2">
                  {video.title}
                </h3>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    {video.views?.toLocaleString() || "0"} views
                  </div>
                  <div className="w-1 h-1 rounded-full bg-gray-300 text-muted-foreground"></div>
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {dayjs(video.createdAt).fromNow()}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVideos.map((video) => (
            <Link
              to={`/video/${video._id}`}
              key={video._id}
              className="flex bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="w-48 sm:w-64 flex-shrink-0 relative">
                <img
                  src={
                    video.thumbnail || "/placeholder.svg?height=720&width=1280"
                  }
                  alt={video.title}
                  className="w-full h-full object-cover aspect-video"
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-1.5 py-0.5 rounded">
                  {formatDuration(video.duration)}
                </div>
              </div>

              <div className="p-4 flex-1">
                <h3 className="font-medium text-lg mb-1">{video.title}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-2">
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {video.views?.toLocaleString() || "0"} views
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {dayjs(video.createdAt).format("MMM D, YYYY")}
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {video.description ||
                    "No description provided for this video."}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
