"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useCommunityStore } from "@/store/communityStore";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { clsx } from "@/lib/utils";
import {
  Hash,
  Volume2,
  Video,
  ChevronDown,
  Plus,
  Settings,
  Users,
  Send,
  Mic,
  MicOff,
  Headphones,
  PhoneOff,
  Edit,
  Trash2,
  PlusCircle,
  UserPlus,
  MessageSquare,
  X,
  Menu,
} from "lucide-react";
import API from "../api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { socket } from "../store/socket";
import SocketStatus from "../components/SocketStatus";
import TypingIndicator from "../components/TypingIndicator";
import OnlineUsersList from "../components/OnlineUsersList";
import { useToast } from "@/hooks/use-toast";

import "../styles/typing-indicator.css";

dayjs.extend(relativeTime);

// Add authentication check at the beginning of the component
const CommunityPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeChannel, setActiveChannel] = useState(null);
  const [showMembers, setShowMembers] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [userVideos, setUserVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [connectedUsers, setConnectedUsers] = useState([]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [communityName, setCommunityName] = useState("");
  const [communityDescription, setCommunityDescription] = useState("");
  const [creatingCommunity, setCreatingCommunity] = useState(false);

  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  // Add authentication check
  useEffect(() => {
    if (!isLoggedIn) {
      toast.error("Please login to access community features");
      navigate("/login");
    }
  }, [isLoggedIn, navigate, toast]);

  const {
    channels,
    messages,
    sendMessage,
    fetchMessages,
    fetchChannels,
    createVideoChannel,
    deleteVideoChannel,
    deleteMessage,
    editMessage,
    initSocketListeners,
    cleanupSocketListeners,
    setActiveChannel: setStoreActiveChannel,
    onlineUsers,
    startTyping,
    stopTyping,
    joinVoiceChannel,
    leaveVoiceChannel,
  } = useCommunityStore();

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  // Initialize socket listeners
  useEffect(() => {
    // Check if socket is connected, if not, try to connect
    if (!socket.connected) {
      socket.connect();
    }

    // Initialize socket listeners
    initSocketListeners();

    // Authenticate user
    if (user) {
      socket.emit("authenticate", user);
    }

    // Join community room
    if (id) {
      socket.emit("join_community", id);
    }

    // Add these new socket listeners for voice channel participants
    socket.on("voice_user_joined", ({ channelId, user: joinedUser }) => {
      if (channelId === activeChannel) {
        setConnectedUsers((prev) => {
          if (!prev.some((u) => u._id === joinedUser._id)) {
            return [...prev, joinedUser];
          }
          return prev;
        });
      }
    });

    socket.on("voice_user_left", ({ channelId, userId }) => {
      if (channelId === activeChannel) {
        setConnectedUsers((prev) => prev.filter((u) => u._id !== userId));
      }
    });

    socket.on("voice_users_list", ({ channelId, users }) => {
      if (channelId === activeChannel) {
        setConnectedUsers(users);
      }
    });

    // Debug socket connection status
    console.log(
      "Socket connection status:",
      socket.connected ? "Connected" : "Disconnected"
    );

    return () => {
      cleanupSocketListeners();
      if (id) {
        socket.emit("leave_community", id);
      }
      // Clean up voice channel socket listeners
      socket.off("voice_user_joined");
      socket.off("voice_user_left");
      socket.off("voice_users_list");
    };
  }, [id, initSocketListeners, cleanupSocketListeners, user, activeChannel]);

  // Fetch community data and channels
  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        setLoading(true);
        // Fetch community data
        const communityRes = await API.get(`/v1/community/get-community/${id}`);
        const fetchedCommunity = communityRes.data.data;

        setCommunity(fetchedCommunity || null);

        // Fetch channels
        if (fetchedCommunity) {
          await fetchChannels(fetchedCommunity._id);

          // Reset active channel when community changes
          setActiveChannel(null);
          setStoreActiveChannel(null);
        }

        setLoading(false);
      } catch (err) {
        navigate("/community-register");
        console.error("Error fetching community data", err);
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, [id, fetchChannels]);

  // Set default active channel when channels are loaded
  useEffect(() => {
    if (channels.text.length > 0 && !activeChannel) {
      const newActiveChannel = channels.text[0]?._id;
      setActiveChannel(newActiveChannel);
      setStoreActiveChannel(newActiveChannel);
    }
  }, [channels, activeChannel, setStoreActiveChannel, id]); // Add 'id' as a dependency

  // Fetch messages when active channel changes
  useEffect(() => {
    if (!activeChannel) return;

    const getMessages = async () => {
      setMessageLoading(true);
      try {
        await fetchMessages(activeChannel);
      } catch (err) {
        console.error("Error fetching messages", err);
      } finally {
        setMessageLoading(false);
      }
    };

    getMessages();

    // Join channel room for real-time updates
    socket.emit("join_channel", activeChannel);

    return () => {
      // Leave channel room when changing channels
      socket.emit("leave_channel", activeChannel);
    };
  }, [activeChannel, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages[activeChannel]]);

  // Fetch user videos for adding video channels
  const fetchUserVideos = async () => {
    try {
      const response = await API.get(`/v1/videos/get-videos/${id}`);
      setUserVideos(response.data.data || []);
    } catch (err) {
      console.error("Error fetching user videos", err);
    }
  };

  const handleAddVideoChannel = () => {
    setShowAddVideoModal(true);
    fetchUserVideos();
  };

  const handleCreateVideoChannel = async () => {
    if (!selectedVideo) return;

    try {
      await createVideoChannel(community?._id, selectedVideo);
      setShowAddVideoModal(false);
      setSelectedVideo(null);
      toast.success("Video channel created successfully");
    } catch (err) {
      console.error("Error creating video channel", err);
      toast.error("Failed to create video channel");
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChannel) return;

    // Send message via socket
    sendMessage(activeChannel, inputMessage);
    setInputMessage("");
  };

  const handleDeleteMessage = (messageId) => {
    if (!activeChannel || !messageId) return;
    deleteMessage(activeChannel, messageId);
  };

  const handleEditMessage = (messageId, text) => {
    if (!activeChannel || !messageId) return;
    editMessage(activeChannel, messageId, text);
  };

  const handleChannelChange = (channelId) => {
    setActiveChannel(channelId);
    setStoreActiveChannel(channelId);

    // Reset voice connection state when changing channels
    if (isVoiceConnected) {
      handleLeaveVoice();
    }

    // Reset connected users list when changing channels
    setConnectedUsers([]);

    // If the new channel is a voice channel, request the current users list
    const newChannel = [
      ...channels.text,
      ...channels.video,
      ...channels.voice,
    ].find((channel) => channel?._id === channelId);

    if (newChannel?.type === "voice") {
      socket.emit("get_voice_users", { channelId });
    }
  };

  const handleJoinVoice = async () => {
    try {
      await joinVoiceChannel();
      setIsVoiceConnected(true);

      // Add current user to connected users list
      setConnectedUsers((prev) => {
        if (!prev.some((u) => u._id === user._id)) {
          return [...prev, user];
        }
        return prev;
      });

      // Request the current list of users in the voice channel
      socket.emit("get_voice_users", { channelId: activeChannel });

      toast.success("Joined voice channel");
    } catch (err) {
      console.error("Error joining voice channel", err);
      toast.error("Failed to join voice channel");
    }
  };

  const handleLeaveVoice = () => {
    try {
      leaveVoiceChannel();
      setIsVoiceConnected(false);
      setIsMuted(false);
      setIsDeafened(false);

      // Remove current user from connected users list
      setConnectedUsers((prev) => prev.filter((u) => u._id !== user._id));

      toast.info("Left voice channel");
    } catch (err) {
      console.error("Error leaving voice channel", err);
      toast.error("Failed to leave voice channel");
    }
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    // Here you would typically also mute the actual audio stream
  };

  // Find current channel object
  const currentChannel = [
    ...channels.text,
    ...channels.video,
    ...channels.voice,
  ].find((channel) => channel?._id === activeChannel);

  const isVoiceChannel = currentChannel?.type === "voice";
  const isVideoChannel = currentChannel?.type === "video";

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    // Handle typing indicator
    if (!isTyping) {
      setIsTyping(true);
      startTyping(activeChannel);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(activeChannel);
    }, 2000); // Stop typing indicator after 2 seconds of inactivity
  };

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    setCreatingCommunity(true);
    try {
      const response = await API.post("/v1/community/create-community", {
        name: communityName,
        description: communityDescription,
      });

      if (response.status === 201) {
        toast.success("Community created successfully!");
        setCommunityName("");
        setCommunityDescription("");
        setShowCreateForm(false);
        navigate(`/community/${response.data.data._id}`);
      } else {
        toast.error("Failed to create community.");
      }
    } catch (error) {
      console.error("Error creating community:", error);
      toast.error("An error occurred while creating the community.");
    } finally {
      setCreatingCommunity(false);
    }
  };

  if (loading) {
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
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="text-muted-foreground">Loading community...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No community found UI
  if (!community) {
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
          <main className="flex-1 p-6 md:p-8 overflow-auto">
            <div className="max-w-4xl mx-auto px-4">
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                {!showCreateForm ? (
                  <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Users className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">
                      No Community Found
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      You don't have a community yet. Create your own community
                      to connect with your audience, host discussions, and share
                      content in real-time.
                    </p>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create Your Community
                    </button>
                  </div>
                ) : (
                  <div className="p-8">
                    <div className="flex items-center mb-6">
                      <button
                        onClick={() => setShowCreateForm(false)}
                        className="mr-4 p-2 rounded-full hover:bg-muted transition-colors"
                      >
                        <ChevronDown className="w-5 h-5 transform rotate-90" />
                      </button>
                      <h2 className="text-2xl font-bold">
                        Create Your Community
                      </h2>
                    </div>

                    <form
                      onSubmit={handleCreateCommunity}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <label
                          htmlFor="community-name"
                          className="block text-sm font-medium"
                        >
                          Community Name{" "}
                          <span className="text-destructive">*</span>
                        </label>
                        <input
                          id="community-name"
                          type="text"
                          value={communityName}
                          onChange={(e) => setCommunityName(e.target.value)}
                          placeholder="Enter community name"
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="community-description"
                          className="block text-sm font-medium"
                        >
                          Description{" "}
                          <span className="text-muted-foreground">
                            (optional)
                          </span>
                        </label>
                        <textarea
                          id="community-description"
                          value={communityDescription}
                          onChange={(e) =>
                            setCommunityDescription(e.target.value)
                          }
                          placeholder="Describe what your community is about"
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px] text-foreground"
                        />
                      </div>

                      <div className="pt-4 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setShowCreateForm(false)}
                          className="px-5 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={creatingCommunity || !communityName.trim()}
                          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
                        >
                          {creatingCommunity ? (
                            <>
                              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2"></div>
                              Creating...
                            </>
                          ) : (
                            <>Create Community</>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Community benefits section */}
                <div className="bg-muted/50 border-t border-border p-8">
                  <h3 className="text-lg font-semibold mb-4">
                    Community Features
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 flex-shrink-0">
                        <MessageSquare className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Real-time Chat</h4>
                        <p className="text-sm text-muted-foreground">
                          Connect with your audience through text, voice, and
                          video channels
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 flex-shrink-0">
                        <Video className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Video Channels</h4>
                        <p className="text-sm text-muted-foreground">
                          Share and discuss your videos with community members
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 flex-shrink-0">
                        <UserPlus className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Grow Your Audience</h4>
                        <p className="text-sm text-muted-foreground">
                          Build a dedicated space for your fans and followers
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-background text-foreground">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div
          className={clsx(
            "flex flex-col flex-1 w-full transition-all duration-300",
            isSidebarOpen ? "md:ml-64" : "md:ml-16"
          )}
        >
          <Header />

          <main className="flex-1 flex overflow-hidden relative">
            {/* Community Channels Sidebar */}
            <div
              className={clsx(
                "w-full sm:w-60 md:w-64 bg-sidebar border-r border-sidebar-border flex-shrink-0 flex flex-col overflow-hidden",
                "absolute inset-y-0 left-0 z-20 transition-transform duration-300 md:relative",
                !isSidebarOpen && "transform -translate-x-full md:translate-x-0"
              )}
            >
              <div className="p-4 border-b border-sidebar-border">
                <h2 className="font-bold text-lg flex items-center justify-between">
                  <span>{community?.name || "Community"}</span>
                  <Settings
                    size={18}
                    className="text-sidebar-foreground/70 cursor-pointer hover:text-sidebar-foreground"
                  />
                </h2>
              </div>

              {/* Channel Categories */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-2 space-y-2">
                  {/* Text Channels */}
                  <div className="flex items-center justify-between p-2 text-sidebar-foreground/70 hover:text-sidebar-foreground cursor-pointer">
                    <div className="flex items-center">
                      <ChevronDown size={16} className="mr-1" />
                      <span className="text-xs font-semibold uppercase">
                        Text Channels
                      </span>
                    </div>
                    <Plus
                      size={16}
                      className="opacity-0 group-hover:opacity-100"
                    />
                  </div>

                  <div className="space-y-1 mt-1">
                    {channels.text.map((channel) => (
                      <button
                        key={channel?._id}
                        className={clsx(
                          "w-full flex items-center p-2 rounded text-sm group cursor-pointer",
                          activeChannel === channel._id
                            ? "bg-sidebar-accent "
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50 "
                        )}
                        onClick={() => handleChannelChange(channel._id)}
                      >
                        <Hash size={18} className="mr-2" />
                        <span>{channel.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Video Channels */}
                  <div className="flex items-center justify-between p-2 mt-4 text-sidebar-foreground/70 hover:text-sidebar-foreground cursor-pointer">
                    <div className="flex items-center">
                      <ChevronDown size={16} className="mr-1" />
                      <span className="text-xs font-semibold uppercase">
                        Video Channels
                      </span>
                    </div>
                    <button
                      onClick={handleAddVideoChannel}
                      className="opacity-70 hover:opacity-100"
                    >
                      <PlusCircle size={16} />
                    </button>
                  </div>

                  <div className="space-y-1 mt-1">
                    {channels.video.map((channel) => (
                      <button
                        key={channel._id}
                        className={clsx(
                          "w-full flex items-center p-2 rounded text-sm group cursor-pointer",
                          activeChannel === channel._id
                            ? "bg-sidebar-accent "
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                        )}
                        onClick={() => handleChannelChange(channel._id)}
                      >
                        <Video size={18} className="mr-2" />
                        <span className="truncate">
                          {channel.linkedVideo?.title || channel.name}
                        </span>
                      </button>
                    ))}

                    {channels.video.length === 0 && (
                      <div className="px-2 py-1 text-xs text-sidebar-foreground/50 italic">
                        No video channels yet
                      </div>
                    )}
                  </div>

                  {/* Voice Channels */}
                  <div className="flex items-center justify-between p-2 mt-4 text-sidebar-foreground/70 hover:text-sidebar-foreground cursor-pointer">
                    <div className="flex items-center">
                      <ChevronDown size={16} className="mr-1" />
                      <span className="text-xs font-semibold uppercase">
                        Voice Channels
                      </span>
                    </div>
                    <Plus
                      size={16}
                      className="opacity-0 group-hover:opacity-100"
                    />
                  </div>

                  <div className="space-y-1 mt-1">
                    {channels.voice.map((channel) => (
                      <div
                        key={channel._id}
                        className="rounded-md overflow-hidden"
                      >
                        <button
                          className={clsx(
                            "w-full flex items-center p-2 rounded-t-md text-sm group",
                            activeChannel === channel._id
                              ? "bg-sidebar-accent "
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                          )}
                          onClick={() => handleChannelChange(channel._id)}
                        >
                          <Volume2 size={18} className="mr-2" />
                          <span>{channel.name}</span>
                        </button>

                        {/* Show connected users if this is the active channel and user is connected */}
                        {activeChannel === channel._id && isVoiceConnected && (
                          <div className="bg-sidebar-accent/30 rounded-b-md px-2 py-1 ml-6 mr-2 mb-1">
                            <div className="flex items-center text-xs text-sidebar-foreground/80 mb-1">
                              <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                              <span className="flex-1">
                                {user.username || "You"}
                              </span>
                              {isMuted ? (
                                <MicOff size={10} className="text-red-500" />
                              ) : (
                                <Mic size={10} className="text-green-500" />
                              )}
                            </div>

                            {/* You can add more connected users here */}
                            {connectedUsers
                              .filter((u) => u._id !== user._id)
                              .map((connectedUser) => (
                                <div
                                  key={connectedUser._id}
                                  className="flex items-center text-xs text-sidebar-foreground/80 mb-1"
                                >
                                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                  <span className="flex-1">
                                    {connectedUser.username}
                                  </span>
                                  <Mic size={10} className="text-green-500" />
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* User Voice Controls - Only show when in voice channel and connected */}
              {isVoiceChannel && isVoiceConnected && (
                <div className="p-3 bg-sidebar-accent/30 border-t border-sidebar-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                        {user?.username?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="text-xs">
                        <div className="font-medium">
                          {user?.username || "User"}
                        </div>
                        <div className="text-sidebar-foreground/70">
                          Connected to voice
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={handleToggleMute}
                        className={clsx(
                          "p-1.5 rounded-full",
                          isMuted
                            ? "bg-red-500/20 text-red-500"
                            : "hover:bg-sidebar-accent"
                        )}
                      >
                        {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                      </button>

                      <button
                        onClick={handleLeaveVoice}
                        className="p-1.5 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500/30"
                      >
                        <PhoneOff size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add a close button for mobile */}
              <button
                onClick={toggleSidebar}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-sidebar-accent text-sidebar-foreground md:hidden"
              >
                <X size={18} />
              </button>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-background min-w-0">
              {/* Channel Header */}
              <div className="h-12 border-b border-border flex items-center px-4 justify-between bg-card">
                <div className="flex items-center">
                  <button
                    onClick={toggleSidebar}
                    className="mr-2 p-1.5 rounded-md hover:bg-accent text-muted-foreground md:hidden"
                  >
                    <Menu size={18} />
                  </button>
                  {currentChannel?.type === "text" && (
                    <Hash size={18} className="mr-2 text-muted-foreground" />
                  )}
                  {currentChannel?.type === "video" && (
                    <Video size={18} className="mr-2 text-muted-foreground" />
                  )}
                  {currentChannel?.type === "voice" && (
                    <Volume2 size={18} className="mr-2 text-muted-foreground" />
                  )}
                  <h3 className="font-medium truncate">
                    {currentChannel?.linkedVideo?.title ||
                      currentChannel?.name ||
                      "channel"}
                  </h3>
                  <div className="ml-3">
                    <SocketStatus />
                  </div>
                </div>

                <button
                  onClick={() => setShowMembers(!showMembers)}
                  className={clsx(
                    "p-1.5 rounded hover:bg-accent",
                    showMembers ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Users size={18} />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-2 sm:p-4">
                {loading || messageLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
                  </div>
                ) : messages[activeChannel]?.length > 0 ? (
                  <div className="space-y-4">
                    {messages[activeChannel].map((message) => (
                      <div key={message._id} className="flex group">
                        <img
                          src={
                            message.sender?.avatar ||
                            "/placeholder.svg?height=40&width=40" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg"
                          }
                          alt={message.sender?.username || "User"}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2 sm:mr-3 mt-1 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <span className="font-medium text-foreground">
                              {message.sender?.username || "User"}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {dayjs(message.createdAt).fromNow()}
                            </span>

                            {/* Message actions - only visible on hover and for own messages */}
                            {message.sender?._id === user?._id && (
                              <div className="ml-2 opacity-0 group-hover:opacity-100 flex">
                                <button
                                  className="p-1 text-muted-foreground hover:text-foreground"
                                  onClick={() => {
                                    const newText = prompt(
                                      "Edit message:",
                                      message.text
                                    );
                                    if (newText && newText !== message.text) {
                                      handleEditMessage(message._id, newText);
                                    }
                                  }}
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  className="p-1 text-muted-foreground hover:text-destructive"
                                  onClick={() =>
                                    handleDeleteMessage(message._id)
                                  }
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-foreground mt-1">{message.text}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <h3 className="text-lg font-medium mb-2">
                        Welcome to{" "}
                        {isVideoChannel
                          ? "video chat"
                          : "#" + (currentChannel?.name || "channel")}
                      </h3>
                      <p>
                        {isVideoChannel
                          ? `This is the beginning of the chat for ${
                              currentChannel?.linkedVideo?.title || "this video"
                            }`
                          : `This is the beginning of the ${currentChannel?.name || "channel"} channel.`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input - Only show for text and video channels */}
              {!isVoiceChannel && (
                <div className="border-t border-border">
                  <TypingIndicator channelId={activeChannel} />
                  <div className="p-2 sm:p-4">
                    <form
                      onSubmit={handleSendMessage}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={handleInputChange}
                        placeholder={`Message ${
                          isVideoChannel
                            ? "video chat"
                            : "#" + (currentChannel?.name || "channel")
                        }`}
                        className="flex-1 bg-secondary border-none rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                      />
                      <button
                        type="submit"
                        disabled={!inputMessage.trim()}
                        className={clsx(
                          "ml-2 p-2 rounded-full",
                          inputMessage.trim()
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                        )}
                      >
                        <Send size={18} />
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Voice Channel UI - Only show for voice channels */}
              {isVoiceChannel && !isVoiceConnected && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full shadow-sm text-center">
                    <Volume2 className="w-12 h-12 mx-auto text-primary/70 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      Voice Channel: {currentChannel?.name || "Voice"}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Connect to this voice channel to chat with other members
                    </p>

                    <button
                      onClick={handleJoinVoice}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors mx-auto"
                    >
                      <Headphones size={18} />
                      <span>Join Voice</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Voice Channel Connected UI */}
              {isVoiceChannel && isVoiceConnected && (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 p-4 flex flex-col items-center justify-center">
                    <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full shadow-sm">
                      <h3 className="text-xl font-semibold mb-4 text-center">
                        Connected to {currentChannel?.name || "Voice"}
                      </h3>

                      <div className="bg-muted/30 rounded-lg p-4 mb-6">
                        <h4 className="text-sm font-medium mb-3 flex items-center">
                          <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span>Connected Users</span>
                        </h4>

                        <div className="space-y-2">
                          {/* Current user */}
                          <div className="flex items-center justify-between bg-background/50 p-2 rounded-md">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                                {user?.username?.charAt(0).toUpperCase() || "U"}
                              </div>
                              <span className="text-sm">
                                {user?.username || "You"}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={handleToggleMute}
                                className={clsx(
                                  "p-1.5 rounded-full transition-colors",
                                  isMuted ? "text-red-500" : "text-green-500"
                                )}
                              >
                                {isMuted ? (
                                  <MicOff size={14} />
                                ) : (
                                  <Mic size={14} />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Other connected users */}
                          {connectedUsers
                            .filter((u) => u._id !== user._id)
                            .map((connectedUser) => (
                              <div
                                key={connectedUser._id}
                                className="flex items-center justify-between bg-background/50 p-2 rounded-md"
                              >
                                <div className="flex items-center">
                                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                                    {connectedUser.username
                                      ?.charAt(0)
                                      .toUpperCase() || "U"}
                                  </div>
                                  <span className="text-sm">
                                    {connectedUser.username}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <div className="p-1.5 text-green-500">
                                    <Mic size={14} />
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Voice Controls Bottom Bar */}
                  <div className="border-t border-border bg-card p-4">
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={handleToggleMute}
                        className={clsx(
                          "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
                          isMuted
                            ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                        <span>{isMuted ? "Unmute" : "Mute"}</span>
                      </button>

                      <button
                        onClick={handleLeaveVoice}
                        className="flex items-center gap-2 px-4 py-2 bg-destructive text-white rounded-md hover:bg-destructive/90 transition-colors"
                      >
                        <PhoneOff size={16} />
                        <span>Disconnect</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Members Sidebar */}
            {showMembers && (
              <div
                className={clsx(
                  "w-full sm:w-60 md:w-64 bg-sidebar border-l border-sidebar-border flex-shrink-0 overflow-hidden flex flex-col absolute right-0 top-0 bottom-0 z-10 md:relative",
                  "md:transform-none"
                )}
              >
                <div className="p-4 border-b border-sidebar-border flex justify-between items-center">
                  <h3 className="font-medium text-sm uppercase text-sidebar-foreground/70">
                    Online — {onlineUsers.length}
                  </h3>
                  <button
                    onClick={() => setShowMembers(false)}
                    className="md:hidden p-1 rounded-full hover:bg-sidebar-accent text-sidebar-foreground"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <OnlineUsersList />
                </div>
              </div>
            )}

            {/* Overlay for mobile when sidebar is open */}
            {(isSidebarOpen || showMembers) && (
              <div
                className="md:hidden fixed inset-0 bg-black/50 z-10"
                onClick={() => {
                  setIsSidebarOpen(false);
                  setShowMembers(false);
                }}
              ></div>
            )}
          </main>
        </div>

        {/* Add Video Channel Modal */}
        {showAddVideoModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg w-full max-w-md p-4 sm:p-6 mx-4">
              <h3 className="text-lg font-medium mb-4">Add Video Channel</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Select a video
                </label>
                <div className="max-h-60 overflow-y-auto border border-border rounded-md">
                  {userVideos.length > 0 ? (
                    userVideos.map((video) => (
                      <div
                        key={video._id}
                        onClick={() => setSelectedVideo(video._id)}
                        className={clsx(
                          "flex items-center p-2 cursor-pointer hover:bg-accent/50",
                          selectedVideo === video._id && "bg-accent"
                        )}
                      >
                        <img
                          src={
                            video.thumbnail ||
                            "/placeholder.svg?height=40&width=60" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg"
                          }
                          alt={video.title}
                          className="w-16 h-10 object-cover rounded mr-2"
                        />
                        <span className="text-sm truncate">{video.title}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      You don't have any videos yet
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowAddVideoModal(false);
                    setSelectedVideo(null);
                  }}
                  className="px-4 py-2 rounded-md border border-border hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateVideoChannel}
                  disabled={!selectedVideo}
                  className={clsx(
                    "px-4 py-2 rounded-md",
                    selectedVideo
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  Create Channel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CommunityPage;
