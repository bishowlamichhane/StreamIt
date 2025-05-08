"use client";

import { useParams, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "@/api";
import {
  Bell,
  BellOff,
  Share2,
  MoreHorizontal,
  Edit,
  Shield,
  Calendar,
  MapPin,
  LinkIcon,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import EditProfileForm from "@/components/EditProfileForm";
import { useToast } from "@/hooks/use-toast";

export default function ChannelLayout() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [owner, setOwner] = useState(false);
  const authUser = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isOwnChannel = authUser?.username === username;
  const [showEditForm, setShowEditForm] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchChannel = async () => {
      try {
        const res = await API.get(`/v1/users/c/${username}`);
        const foundChannel = res.data.data;
        setChannel(foundChannel);
        setIsSubscribed(foundChannel?.isSubscribed);
      } catch (err) {
        console.error("Error fetching channel", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChannel();
  }, [username]);

  const handleSubscribe = async () => {
    try {
      const res = await API.post(`/v1/subs/sub/${channel._id}`);
      const message = res.data.message;
      message === "Subscribed" ? setIsSubscribed(true) : setIsSubscribed(false);
    } catch (err) {
      console.log("Error with subscription:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-gray-300 dark:border-gray-700 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="p-8 text-center">
        <div className="bg-destructive/10 text-destructive p-6 rounded-xl inline-block">
          <h2 className="text-2xl font-bold mb-2">Channel Not Found</h2>
          <p>
            The channel you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background transition-colors">
      {/* Cover Image */}
      <div className="relative">
        <div className="w-full h-32 md:h-48 lg:h-72 overflow-hidden bg-muted">
          <img
            src={channel.coverImage || "/placeholder.svg?height=400&width=1200"}
            className="w-full h-full object-cover"
            alt="Channel cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        </div>

        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-end -mt-16 md:-mt-20 relative z-10 pb-4">
            <div className="flex-shrink-0 mb-2 md:mb-0 mr-0 md:mr-6">
              <img
                src={channel.avatar || "/placeholder.svg?height=128&width=128"}
                className="w-20 h-20 md:w-32 md:h-32 rounded-full border-4 border-background shadow-md object-cover"
                alt={`${channel.fullName}'s avatar`}
              />
            </div>
            <div className="flex-grow mt-4 md:mt-0 text-white">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <h1 className="text-xl md:text-3xl font-bold">
                  {channel.fullName}
                </h1>
                {channel.verified && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                    <Shield className="w-3 h-3 mr-1" /> Verified
                  </span>
                )}
              </div>
              <p className="text-gray-300">@{channel.username}</p>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-gray-300">
                  <span className="font-medium">
                    {channel.subscribersCount?.toLocaleString() || 0}
                  </span>{" "}
                  subscribers •{" "}
                  <span className="font-medium">
                    {channel.videosCount?.toLocaleString() || 0}
                  </span>{" "}
                  videos
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-300">
                {channel.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{channel.location}</span>
                  </div>
                )}
                {channel.joinedDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {channel.joinedDate}</span>
                  </div>
                )}
                {channel.website && (
                  <div className="flex items-center gap-1">
                    <LinkIcon className="w-4 h-4" />
                    <a
                      href={channel.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {channel.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 md:mt-0 md:ml-auto w-full md:w-auto">
              {isOwnChannel ? (
                <button
                  onClick={() => setShowEditForm((prev) => !prev)}
                  className="w-full md:w-auto px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1 justify-center"
                >
                  <Edit className="w-4 h-4" />
                  {showEditForm ? "Cancel Edit" : "Edit Profile"}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSubscribe}
                    className={`w-full md:w-auto px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 justify-center ${
                      isSubscribed
                        ? "bg-secondary text-foreground hover:bg-secondary/80"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {isSubscribed ? "Subscribed" : "Subscribe"}
                  </button>
                  <div className="hidden md:flex">
                    <button className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors">
                      {isSubscribed ? (
                        <Bell size={20} />
                      ) : (
                        <BellOff size={20} />
                      )}
                    </button>
                    <button className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors">
                      <Share2 size={20} />
                    </button>
                    <button className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="sticky top-0 bg-background z-10 shadow-sm border-b border-border transition-colors">
        <div className="container mx-auto px-4">
          <nav className="flex overflow-x-auto">
            <NavLink to="" end className={tabClass}>
              Videos
            </NavLink>
            <NavLink to="playlists" className={tabClass}>
              Playlists
            </NavLink>
            <NavLink
              to="community"
              className={tabClass}
              onClick={(e) => {
                if (!isLoggedIn) {
                  e.preventDefault();
                  toast.error("Please login to access community features");
                  navigate("/login");
                }
              }}
            >
              Community
            </NavLink>
            <NavLink to="about" className={tabClass}>
              About
            </NavLink>
          </nav>
        </div>
      </div>

      {showEditForm && (
        <div className="container mx-auto px-4 py-6 border-b bg-muted/50 border-border transition-colors">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Edit Your Profile</h2>
            <EditProfileForm
              currentData={channel}
              onSuccess={() => {
                setShowEditForm(false);
                window.location.reload(); // Refresh to reflect updates
              }}
            />
          </div>
        </div>
      )}

      {/* Render inner pages */}
      <div className="container mx-auto px-4 py-6">
        <Outlet />
      </div>
    </div>
  );
}

const tabClass = ({ isActive }) =>
  `px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
    isActive
      ? "border-primary text-primary"
      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
  }`;
