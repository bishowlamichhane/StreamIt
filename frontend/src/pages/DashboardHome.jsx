"use client";

import { useAuthStore } from "@/store/authStore";
import { useState, useEffect } from "react";
import { Clock, TrendingUp, ChevronRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import API from "../api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const DashboardHome = () => {
  const { user, isLoggedIn } = useAuthStore();
  const [categories] = useState([
    { id: 1, name: "Music", icon: "🎵" },
    { id: 2, name: "Gaming", icon: "🎮" },
    { id: 3, name: "Education", icon: "📚" },
    { id: 4, name: "Entertainment", icon: "🎭" },
    { id: 5, name: "Sports", icon: "⚽" },
    { id: 7, name: "Technology", icon: "💻" },
  ]);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [videoData, setVideoData] = useState({
    title: "",
    description: "",
    video: null,
    category: "",
    thumbnail: null,
  });

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setVideoData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setVideoData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", videoData.title);
    formData.append("description", videoData.description);
    formData.append("category", videoData.category);
    formData.append("videos", videoData.video);
    formData.append("thumbnails", videoData.thumbnail);

    try {
      const res = await API.post("/v1/videos/upload-video", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user.accessToken}`,
        },
      });
      setShowModal(false); // Close modal on success
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  useEffect(() => {
    const fetchRandomVideos = async () => {
      try {
        const res = await API.get("/v1/videos/random-videos");
        setVideos(res.data.data || []);
      } catch (err) {
        console.log("Failed to load videos ", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRandomVideos();
  }, []);

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
            <Link
              key={category.id}
              to="#"
              className="bg-card hover:bg-accent rounded-lg p-3 text-center border border-border transition-colors group"
            >
              <div className="text-2xl mb-1">{category.icon}</div>
              <div className="text-sm font-medium group-hover:text-primary transition-colors">
                {category.name}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recommended Videos */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary" /> Recommended for
            you
          </h2>
          <Link
            to="#"
            className="text-primary hover:underline flex items-center text-sm"
          >
            See all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {videos.map((video) => (
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

                <p className="text-sm text-muted-foreground mt-1">
                  {video.views} views • {dayjs(video.createdAt).fromNow()}
                </p>

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
      </div>

      {showModal && (
        <div className="fixed inset-0 backdrop-blur-lg bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg w-[90%] md:w-[500px] relative border border-border shadow-lg">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              ✖
            </button>
            <h2 className="text-xl font-semibold mb-4">Upload a Video</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              {/* Title Input */}
              <input
                type="text"
                name="title"
                placeholder="Title"
                value={videoData.title}
                onChange={handleChange}
                required
                className="w-full border border-border bg-background px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />

              {/* Description Input */}
              <textarea
                name="description"
                placeholder="Description"
                value={videoData.description}
                onChange={handleChange}
                required
                className="w-full border border-border bg-background px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
              ></textarea>

              {/* Video File Input */}
              <div className="border border-border rounded-md p-4 bg-muted/50">
                <p className="text-sm font-medium mb-2">Video File</p>
                <input
                  type="file"
                  name="video"
                  accept="video/*"
                  onChange={handleChange}
                  required
                  className="w-full text-sm cursor-pointer"
                />
              </div>

              {/* Thumbnail File Input */}
              <div className="border border-border rounded-md p-4 bg-muted/50">
                <p className="text-sm font-medium mb-2">Thumbnail Image</p>
                <input
                  type="file"
                  name="thumbnail"
                  accept="image/*"
                  onChange={handleChange}
                  required
                  className="w-full text-sm cursor-pointer"
                />
              </div>

              {/* Category Selection */}
              <div className="border border-border rounded-md p-4 bg-muted/50">
                <p className="text-sm font-medium mb-2">Select Category</p>
                <select
                  name="category"
                  value={videoData.category}
                  onChange={handleChange}
                  required
                  className="w-full border border-border bg-background px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm cursor-pointer"
                >
                  <option value="">Select a category</option>
                  <option value="Music">Music</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Education">Education</option>
                  <option value="Sports">Sports</option>
                  <option value="Tech">Tech</option>
                </select>
              </div>

              {/* Upload Button */}
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 font-medium cursor-pointer"
              >
                Upload
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
