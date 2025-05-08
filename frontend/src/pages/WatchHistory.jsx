import React, { useEffect, useState } from "react";
import API from "@/api";
import { X } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Link } from "react-router-dom";

dayjs.extend(relativeTime);

const formatDuration = (seconds) => {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

const WatchHistory = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await API.get("/v1/users/history");
      setVideos(res.data.data || []);
    } catch (err) {
      console.error("Error fetching watch history", err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromHistory = async (videoId) => {
    try {
      await API.delete(`/v1/users/remove-history/${videoId}`);
      setVideos((prev) => prev.filter((video) => video._id !== videoId));
    } catch (err) {
      console.error("Failed to remove video from history", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!videos.length) {
    return (
      <div className="p-6 text-center text-gray-600">
        No videos in your watch history yet.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Watch History</h2>
      <div className="space-y-4">
        {videos.map((video) => (
          <div
            key={video._id}
            className="flex items-start bg-card shadow-sm rounded-md overflow-hidden relative hover:shadow-md transition "
          >
            <Link
              to={`/video/${video._id}`}
              className="w-48 h-28 flex-shrink-0 relative"
            >
              <img
                src={video.thumbnail || "/placeholder-video.jpg"}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              {/* Duration Overlay */}
              <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 py-0.5 rounded">
                {formatDuration(video.duration)}
              </div>
            </Link>

            <div className="flex-grow  px-4 py-2">
              <Link to={`/video/${video._id}`}>
                <h3 className="text-md font-semibold line-clamp-2 hover:underline">
                  {video.title}
                </h3>
              </Link>

              <p className="text-sm text-muted-foreground mt-1">
                {video.views} views • {dayjs(video.createdAt).fromNow()}
              </p>

              {/* Channel info with avatar */}
              <Link
                to={`/dashboard/channel/${video.owner?.username}/${video.owner?._id}`}
                className="flex items-center gap-2 mt-2"
              >
                <img
                  src={video.owner?.avatar || "/placeholder.jpg"}
                  alt="avatar"
                  className="w-6 h-6 rounded-full"
                />
                <p className="text-sm text-muted-foreground">
                  {video.owner?.username || "Unknown"}
                </p>
              </Link>
            </div>

            <button
              onClick={() => removeFromHistory(video._id)}
              className="absolute top-2 right-2 p-2 rounded-full bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-500 cursor-pointer"
              title="Remove from history"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WatchHistory;
