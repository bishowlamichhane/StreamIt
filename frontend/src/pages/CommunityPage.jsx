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
  // Add debounced typing indicator in the component
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  // New state for community creation
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [communityName, setCommunityName] = useState("");
  const [communityDescription, setCommunityDescription] = useState("");
  const [creatingCommunity, setCreatingCommunity] = useState(false);

  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();

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
    };
  }, [id, initSocketListeners, cleanupSocketListeners, user]);

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
  };

  const toggleVoiceConnection = () => {
    setIsVoiceConnected(!isVoiceConnected);
    if (isVoiceConnected) {
      setIsMuted(false);
      setIsDeafened(false);
      // Emit leave voice channel event
      socket.emit("leave_voice", activeChannel);
    } else {
      // Emit join voice channel event
      socket.emit("join_voice", activeChannel);
    }
  };

  // Find current channel object
  const currentChannel = [
    ...channels.text,
    ...channels.video,
    ...channels.voice,
  ].find((channel) => channel?._id === activeChannel);

  const isVoiceChannel = currentChannel?.isVoice || false;
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

  // Handle community creation form submission
  const handleCreateCommunity = async (e) => {
    e.preventDefault();

    if (!communityName.trim()) {
      toast.error("Community name is required");
      return;
    }

    setCreatingCommunity(true);

    try {
      await API.post("/v1/community/create-community", {
        name: communityName,
      });

      toast.success("Community created successfully!");

      // Reset form
      setCommunityName("");
      setCommunityDescription("");
      setShowCreateForm(false);

      // Refresh the page to show the new community
      // In a real implementation, you might want to fetch the new community data instead
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast.error("Failed to create community");
      console.error("Error creating community:", error);
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
            <div className="max-w-4xl mx-auto">
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
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
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
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

          <main className="flex-1 flex overflow-hidden">
            {/* Community Channels Sidebar */}
            <div className="w-60 bg-sidebar border-r border-sidebar-border flex-shrink-0 flex flex-col">
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
                <div className="p-2">
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
                            ? "bg-sidebar-accent text-sidebar-primary"
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
                            ? "bg-sidebar-accent text-sidebar-primary"
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
                      <button
                        key={channel._id}
                        className={clsx(
                          "w-full flex items-center p-2 rounded text-sm group",
                          activeChannel === channel._id
                            ? "bg-sidebar-accent text-sidebar-primary"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                        )}
                        onClick={() => handleChannelChange(channel._id)}
                      >
                        <Volume2 size={18} className="mr-2" />
                        <span>{channel.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* User Voice Controls - Only show when in voice channel */}
              {isVoiceChannel && (
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
                          {isVoiceConnected ? "Connected" : "Disconnected"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      {isVoiceConnected ? (
                        <>
                          <button
                            onClick={() => setIsMuted(!isMuted)}
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
                            onClick={() => setIsDeafened(!isDeafened)}
                            className={clsx(
                              "p-1.5 rounded-full",
                              isDeafened
                                ? "bg-red-500/20 text-red-500"
                                : "hover:bg-sidebar-accent"
                            )}
                          >
                            {isDeafened ? (
                              <PhoneOff size={16} />
                            ) : (
                              <Headphones size={16} />
                            )}
                          </button>

                          <button
                            onClick={toggleVoiceConnection}
                            className="p-1.5 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500/30"
                          >
                            <PhoneOff size={16} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={toggleVoiceConnection}
                          className="p-1.5 rounded-full bg-green-500/20 text-green-500 hover:bg-green-500/30"
                        >
                          <Headphones size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-background">
              {/* Channel Header */}
              <div className="h-12 border-b border-border flex items-center px-4 justify-between">
                <div className="flex items-center">
                  {currentChannel?.type === "text" && (
                    <Hash size={18} className="mr-2 text-muted-foreground" />
                  )}
                  {currentChannel?.type === "video" && (
                    <Video size={18} className="mr-2 text-muted-foreground" />
                  )}
                  {currentChannel?.type === "voice" && (
                    <Volume2 size={18} className="mr-2 text-muted-foreground" />
                  )}
                  <h3 className="font-medium">
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
              <div className="flex-1 overflow-y-auto p-4">
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
                            "/placeholder.svg"
                          }
                          alt={message.sender?.username || "User"}
                          className="w-10 h-10 rounded-full mr-3 mt-1"
                        />
                        <div className="flex-1">
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
                  <div className="p-4">
                    <form
                      onSubmit={handleSendMessage}
                      className="flex items-center"
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
                        className="flex-1 bg-muted border-none rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
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
                <div className="p-4 border-t border-border">
                  <button
                    onClick={toggleVoiceConnection}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center"
                  >
                    <Headphones size={18} className="mr-2" />
                    Join Voice
                  </button>
                </div>
              )}
            </div>

            {/* Members Sidebar */}
            {showMembers && (
              <div className="w-60 bg-sidebar border-l border-sidebar-border flex-shrink-0 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-sidebar-border">
                  <h3 className="font-medium text-sm uppercase text-sidebar-foreground/70">
                    Online — {onlineUsers.length}
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <OnlineUsersList />
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Add Video Channel Modal */}
        {showAddVideoModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg w-full max-w-md p-6">
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
