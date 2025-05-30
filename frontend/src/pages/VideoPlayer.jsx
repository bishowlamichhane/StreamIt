"use client";

import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "@/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  Download,
  MoreHorizontal,
  MessageSquare,
  Bookmark,
  Home,
  Users,
  Menu,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { clsx } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
dayjs.extend(relativeTime);

export default function VideoPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subCount, setSubCount] = useState(0);
  const [owner, setOwner] = useState(false);
  const [commentList, setCommentList] = useState([]);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar collapsed by default
  const [videoLoaded, setVideoLoaded] = useState(false); // Track if video data has been loaded
  const user = useAuthStore((state) => state.user);
  const toast = useToast();

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  useEffect(() => {
    // Reset states when video ID changes
    setLoading(true);
    setVideoLoaded(false);
    setVideo(null);

    const fetchVideo = async () => {
      try {
        const res = await API.get(`/v1/videos/v/${id}`, {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        });

        const foundVideo = res.data.data || null;
        setVideo(foundVideo);
        setVideoLoaded(true);

        await API.post("/v1/users/watch-history", { videoId: id });
      } catch (err) {
        console.error("Error loading video", err);
        setVideoLoaded(true); // Mark as loaded even on error to show error state
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  useEffect(() => {
    const fetchSubs = async () => {
      if (!video?.owner?._id || !user?.username) return;

      try {
        const res = await API.get(`/v1/subs/subCount/${video.owner?._id}`, {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        });
        const subscribers = res.data.data;
        console.log("subscribers", subscribers);
        setSubCount(subscribers.subsCount);
        const isUserSubscribed = subscribers.subscribers.some(
          (sub) => sub.username === user?.username
        );
        console.log("isUserSubscribed:", isUserSubscribed); // Debug log
        setIsSubscribed(isUserSubscribed);
      } catch (err) {
        console.error("Error fetching subscriber count", err);
      }
    };

    fetchSubs();
  }, [video?.owner?._id, user?.username, user?.accessToken]); // Added accessToken dependency

  const handleLikeToggle = async () => {
    try {
      // Store the current liked state before making the API call
      const wasLiked = video.isLikedByUser;

      await API.post(`/v1/likes/like/${id}`, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
        },
      });

      const updated = await API.get(`/v1/videos/v/${id}`, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
        },
      });
      setVideo(updated.data.data);

      // Show appropriate toast message based on the previous state
      toast.success(
        wasLiked ? "Removed from liked videos" : "Added to liked videos"
      );
    } catch (err) {
      console.error("Failed to toggle like", err);
      toast.error("Failed to update like status");
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      const res = await API.post(`/v1/subs/sub/${video.owner?._id}`, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
        },
      });

      const message = res.data.message;
      console.log("message", message);

      const newSubscribedState = message === "Subscribed";
      setIsSubscribed(newSubscribedState);
      setSubCount((prev) => (newSubscribedState ? prev + 1 : prev - 1));

      if (message === "Subscribed") {
        toast.success(
          `Subscribed to ${video.owner.fullName || video.owner.username}`
        );
      } else {
        toast.info(
          `Unsubscribed from ${video.owner.fullName || video.owner.username}`
        );
      }
    } catch (err) {
      console.log("Error with subscription :", err);
      toast.error("Failed to update subscription");
    }
  };

  useEffect(() => {
    const fetchRandomVideos = async () => {
      try {
        const res = await API.get("/v1/videos/random-videos");
        const foundVideos = res.data.data || [];

        const actualVideos = foundVideos.filter((item) => item._id != id);
        setRelatedVideos(actualVideos);
      } catch (err) {
        console.log("Failed to load videos ", err);
      }
    };
    fetchRandomVideos();
  }, [id]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await API.post(`/v1/comments/add/${id}`, { commentText });
      toast.success("Comment added successfully");
      // ✅ Refetch all comments from backend
      fetchComments();
    } catch (err) {
      console.log("Error adding comment ", err);
      toast.error("Failed to add comment");
    }

    setCommentText("");
  };

  const fetchComments = async () => {
    try {
      const res = await API.get(`/v1/comments/get/${id}`);
      const commentFetched = res.data.data || [];
      setCommentList(commentFetched);
    } catch (err) {
      console.log("Error fetching comments ", err);
    }
  };

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await API.get(`/v1/comments/get/${id}`);
        const commentFetched = res.data.data || [];
        setCommentList(commentFetched);
      } catch (err) {
        console.log("Error fetching comments ", err);
      }
    };

    fetchComments();
  }, [id]); // ✅ now it runs only when video id changes

  // Show loading state until both loading is complete and video data is processed
  if (loading || !videoLoaded) {
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
          <div className="flex items-center justify-center h-screen">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="text-muted-foreground">Loading video...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only show "Video Not Found" after loading is complete and we know there's no video
  if (!video) {
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
          <main className="p-6 bg-background flex-1">
            <div className="max-w-[1280px] mx-auto px-4 py-16 text-center">
              <div className="bg-destructive/10 text-destructive p-6 rounded-xl">
                <h2 className="text-2xl font-bold mb-2">Video Not Found</h2>
                <p>
                  The video you're looking for might have been removed or is
                  unavailable.
                </p>
                <Link
                  to="/dashboard"
                  className="mt-4 inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
        <main className="p-4 md:p-6 bg-background flex-1 overflow-auto pb-16 md:pb-6">
          <div className="max-w-[1280px] mx-auto">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Main Content Column */}
              <div className="flex-1">
                {/* Video Player */}
                <div className="aspect-video w-full bg-black mb-3 rounded-xl overflow-hidden shadow-lg cursor-pointer">
                  <video
                    src={video.videoFile}
                    controls
                    className="w-full h-full object-contain"
                    poster={video.thumbnail}
                    autoPlay
                  ></video>
                </div>

                {/* Video Title */}
                <h1 className="text-xl md:text-2xl font-semibold mt-3 mb-2 text-foreground">
                  {video.title}
                </h1>

                {/* Video Stats & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 pb-3 border-b border-border">
                  <div className="text-sm text-muted-foreground">
                    {video.views?.toLocaleString() || "0"} views •{" "}
                    {dayjs(video.createdAt).fromNow()}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0">
                    <div className="flex items-center bg-muted rounded-full overflow-hidden">
                      <button
                        className={`flex items-center px-4 py-2 gap-1 hover:bg-accent transition-colors cursor-pointer ${
                          video.isLikedByUser
                            ? "text-primary font-medium"
                            : "text-foreground"
                        }`}
                        onClick={handleLikeToggle}
                      >
                        <ThumbsUp
                          size={18}
                          className={`transition-all duration-300 ${
                            video.isLikedByUser
                              ? "text-primary fill-primary scale-110"
                              : "text-foreground"
                          } active:scale-150 active:rotate-12`}
                        />
                        <span>{video.likeCount?.toLocaleString() || "0"}</span>
                      </button>
                      <div className="h-5 w-px bg-border"></div>
                      <button className="flex items-center px-4 py-2 gap-1 hover:bg-accent transition-colors cursor-pointer text-foreground">
                        <ThumbsDown size={18} />
                      </button>
                    </div>

                    <button className="flex items-center px-4 py-2 gap-1 bg-muted rounded-full hover:bg-accent transition-colors text-foreground">
                      <Share2 size={18} />
                      <span className="hidden sm:inline">Share</span>
                    </button>

                    <button className="flex items-center px-4 py-2 gap-1 bg-muted rounded-full hover:bg-accent transition-colors text-foreground">
                      <Download size={18} />
                      <span className="hidden sm:inline">Download</span>
                    </button>

                    <button className="flex items-center px-4 py-2 gap-1 bg-muted rounded-full hover:bg-accent transition-colors text-foreground">
                      <Bookmark size={18} />
                      <span className="hidden sm:inline">Save</span>
                    </button>

                    <button className="p-2 rounded-full hover:bg-accent transition-colors text-foreground">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </div>

                {/* Channel Info */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between py-4 border-b border-border mb-4 bg-card/50 rounded-lg p-4 gap-4">
                  <div className="flex items-start gap-3">
                    <Link
                      to={`/dashboard/channel/${video.owner.username}/${video.owner._id}`}
                    >
                      <img
                        src={
                          video.owner.avatar ||
                          "/placeholder.svg?height=40&width=40"
                        }
                        alt="Channel avatar"
                        className="w-12 h-12 rounded-full border-2 border-background shadow-sm"
                      />
                    </Link>
                    <div>
                      <Link
                        to={`/dashboard/channel/${video.owner.username}/${video.owner._id}`}
                      >
                        <h3 className="font-medium text-lg text-foreground">
                          {video.owner.fullName || "Channel Name"}
                        </h3>
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {subCount || "0"} subscribers
                      </p>
                      <div className="mt-3 text-sm text-foreground line-clamp-2 max-w-2xl">
                        {video.description ||
                          "No description provided for this video."}
                      </div>
                      {video.description?.length > 120 && (
                        <button className="text-sm font-medium mt-1 text-primary hover:underline">
                          Show more
                        </button>
                      )}
                    </div>
                  </div>
                  {video.owner._id === user?._id ? (
                    <Link
                      to={`/dashboard/channel/${video.owner.username}/${video.owner._id}`}
                      className="px-4 py-2 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full sm:w-auto text-center"
                    >
                      View Analytics
                    </Link>
                  ) : (
                    <button
                      onClick={handleSubscribe}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer w-full sm:w-auto ${
                        isSubscribed
                          ? "bg-muted text-foreground hover:bg-accent"
                          : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      }`}
                    >
                      {isSubscribed ? "Subscribed" : "Subscribe"}
                    </button>
                  )}
                </div>

                {/* Comments Section */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-medium text-lg text-foreground">
                      {commentList.length} Comments
                    </h3>

                    <button className="text-sm flex items-center gap-1 text-muted-foreground hover:text-foreground">
                      <span>Sort by</span>
                    </button>
                  </div>

                  {/* Comment Input */}
                  <form
                    onSubmit={handleCommentSubmit}
                    className="flex gap-3 mb-6"
                  >
                    <img
                      src={
                        user?.avatar || "/placeholder.svg?height=40&width=40"
                      }
                      alt="Your avatar"
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 flex flex-col">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="w-full border-b border-border pb-2 focus:border-primary focus:outline-none bg-transparent text-foreground"
                      />
                      {commentText.trim() && (
                        <div className="flex justify-end mt-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setCommentText("")}
                            className="px-4 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted rounded-full cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 cursor-pointer"
                          >
                            Comment
                          </button>
                        </div>
                      )}
                    </div>
                  </form>

                  {/* Comments List - Empty state */}
                  <div className="space-y-4 bg-card/50 rounded-lg p-6">
                    {commentList?.length === 0 ? (
                      <div className="text-center">
                        <MessageSquare className="w-12 h-12 mx-auto text-muted" />
                        <p className="text-foreground font-medium">
                          No comments yet
                        </p>
                        <p className="text-muted-foreground text-sm mt-1">
                          Be the first to share your thoughts on this video
                        </p>
                      </div>
                    ) : (
                      commentList.map((comment, index) => (
                        <div
                          key={index}
                          className="flex gap-3 border-b border-border pb-4 last:border-none"
                        >
                          <img
                            src={
                              comment.ownerDetails?.[0]?.avatar ||
                              "/placeholder.svg?height=40&width=40"
                            }
                            alt="Commenter avatar"
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm text-foreground">
                                {comment.ownerDetails?.[0]?.username ||
                                  "Anonymous"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {dayjs(comment.createdAt).fromNow()}
                              </p>
                            </div>
                            <p className="text-sm text-foreground mt-1">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Sidebar - Related Videos */}
              <div className="w-full lg:w-[350px] lg:flex-shrink-0">
                <h3 className="font-medium text-lg mb-4 text-foreground">
                  Related Videos
                </h3>
                <div className="space-y-4">
                  {relatedVideos.map((relVideo) => (
                    <Link
                      key={relVideo._id}
                      to={`/video/${relVideo._id}`}
                      className="flex gap-3 group"
                    >
                      <div className="w-40 flex-shrink-0 relative">
                        <img
                          src={relVideo.thumbnail || "/placeholder.svg"}
                          alt={relVideo.title}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 py-0.5 rounded">
                          {formatDuration(relVideo.duration)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                          {relVideo.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {relVideo.owner.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {relVideo.views} views •{" "}
                          {dayjs(relVideo.createdAt).fromNow()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border z-30">
        <div className="flex justify-around items-center h-16">
          <Link
            to="/"
            className="flex flex-col items-center justify-center text-sidebar-foreground p-2"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <button
            onClick={handleLikeToggle}
            className="flex flex-col items-center justify-center text-sidebar-foreground p-2"
          >
            <ThumbsUp
              className={`h-5 w-5 ${video.isLikedByUser ? "text-primary fill-primary" : ""}`}
            />
            <span className="text-xs mt-1">Like</span>
          </button>
          <button
            onClick={handleSubscribe}
            className="flex flex-col items-center justify-center text-sidebar-foreground p-2"
          >
            <Users
              className={`h-5 w-5 ${isSubscribed ? "text-primary" : ""}`}
            />
            <span className="text-xs mt-1">
              {isSubscribed ? "Subbed" : "Subscribe"}
            </span>
          </button>
          <button className="flex flex-col items-center justify-center text-sidebar-foreground p-2">
            <Share2 className="h-5 w-5" />
            <span className="text-xs mt-1">Share</span>
          </button>
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
}
