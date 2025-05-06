import { create } from "zustand"
import API from "../api"
import { socket } from "./socket"
import { useAuthStore } from "./authStore"

export const useCommunityStore = create((set, get) => ({
  activeChannel: null,
  channelData: null,
  messages: {},
  loading: false,
  error: null,
  socketConnected: false,
  channels: {
    text: [],
    video: [],
    voice: [],
  },
  onlineUsers: [],
  typingUsers: {},

  setActiveChannel: (channelId) => set({ activeChannel: channelId }),

  // Initialize socket listeners
  initSocketListeners: () => {
    // Remove any existing listeners to prevent duplicates
    socket.off("receive_message")
    socket.off("online_users_updated")
    socket.off("user_typing")
    socket.off("user_stopped_typing")
    socket.off("message_deleted")
    socket.off("message_updated")

    // Update connection status
    socket.on("connect", () => {
      set({ socketConnected: true })

      // Authenticate user when socket connects
      const user = useAuthStore.getState().user
      if (user) {
        socket.emit("authenticate", user)
      }
    })

    socket.on("disconnect", () => {
      set({ socketConnected: false })
    })

    // Listen for new messages
    socket.on("receive_message", (message) => {
      const state = get()
      const channelId = message.channel


      // Only update if we have this channel in our messages
      if (channelId) {
        // Check if this message already exists (by _id or by matching content and timestamp)
        const existingMessages = state.messages[channelId] || []
        const isDuplicate = existingMessages.some(
          (msg) =>
            msg._id === message._id ||
            (msg.text === message.text &&
              msg.sender?._id === message.sender?._id &&
              Math.abs(new Date(msg.createdAt) - new Date(message.createdAt)) < 5000), // Within 5 seconds
        )

        if (!isDuplicate) {
          set({
            messages: {
              ...state.messages,
              [channelId]: [...existingMessages, message],
            },
          })
        } 
      }
    })

    // Listen for online users updates
    socket.on("online_users_updated", (users) => {
      set({ onlineUsers: users })
    })

    // Listen for typing indicators
    socket.on("user_typing", ({ channelId, user }) => {
      if (channelId) {
        set((state) => ({
          typingUsers: {
            ...state.typingUsers,
            [channelId]: [...(state.typingUsers[channelId] || []), user],
          },
        }))
      }
    })

    socket.on("user_stopped_typing", ({ channelId, user }) => {
      if (channelId) {
        set((state) => ({
          typingUsers: {
            ...state.typingUsers,
            [channelId]: (state.typingUsers[channelId] || []).filter((u) => u._id !== user._id),
          },
        }))
      }
    })

    // Listen for message deletion
    socket.on("message_deleted", ({ messageId, channelId }) => {
      if (messageId && channelId) {
        set((state) => ({
          messages: {
            ...state.messages,
            [channelId]: (state.messages[channelId] || []).filter((msg) => msg._id !== messageId),
          },
        }))
      }
    })

    // Listen for message updates
    socket.on("message_updated", (updatedMessage) => {
      if (updatedMessage && updatedMessage.channel) {
        const channelId = updatedMessage.channel
        set((state) => ({
          messages: {
            ...state.messages,
            [channelId]: (state.messages[channelId] || []).map((msg) =>
              msg._id === updatedMessage._id ? updatedMessage : msg,
            ),
          },
        }))
      }
    })
  },

  // Clean up socket listeners
  cleanupSocketListeners: () => {
    socket.off("receive_message")
    socket.off("online_users_updated")
    socket.off("user_typing")
    socket.off("user_stopped_typing")
    socket.off("message_deleted")
    socket.off("message_updated")
    socket.off("connect")
    socket.off("disconnect")
  },

  // Start typing indicator
  startTyping: (channelId) => {
    const user = useAuthStore.getState().user
    if (channelId && user) {
      socket.emit("typing_start", { channelId, user })
    }
  },

  // Stop typing indicator
  stopTyping: (channelId) => {
    const user = useAuthStore.getState().user
    if (channelId && user) {
      socket.emit("typing_stop", { channelId, user })
    }
  },

  fetchCommunity: async (communityId) => {
    set({ loading: true })
    try {
      const response = await API.get(`/v1/community/get-community/${communityId}`)
      const community = response.data.data

      // Group channels by type
      const groupedChannels = {
        text: community.channels.filter((channel) => channel.type === "text"),
        video: community.channels.filter((channel) => channel.type === "video"),
        voice: community.channels.filter((channel) => channel.type === "voice"),
      }

      set({
        community,
        channels: groupedChannels,
        loading: false,
        error: null,
      })

      return community
    } catch (err) {
      console.error("Error fetching community", err)
      set({
        loading: false,
        error: err.response?.data?.message || "Failed to load community",
      })
      return null
    }
  },

  fetchChannels: async (communityId) => {
    set({ loading: true })
    try {
      const response = await API.get(`/v1/community/get-channels/${communityId}`)

      // Group channels by type after receiving them
      const allChannels = response.data.data || []
      const groupedChannels = {
        text: allChannels.filter((channel) => channel.type === "text"),
        video: allChannels.filter((channel) => channel.type === "video"),
        voice: allChannels.filter((channel) => channel.type === "voice"),
      }

      set({
        channels: groupedChannels,
        loading: false,
        error: null,
      })
      return groupedChannels
    } catch (err) {
      console.error("Error fetching channels", err)
      set({
        loading: false,
        error: err.response?.data?.message || "Failed to load channels",
      })
      return {
        text: [],
        video: [],
        voice: [],
      }
    }
  },

  createVideoChannel: async (communityId, videoId) => {
    try {
      const response = await API.post("/v1/community/video-channel", {
        communityId,
        videoId,
      })

      // Update channels in store
      await get().fetchChannels(communityId)

      return response.data.data
    } catch (err) {
      console.error("Error creating video channel", err)
      set({
        error: err.response?.data?.message || "Failed to create video channel",
      })
      return null
    }
  },

  deleteVideoChannel: async (communityId, channelId) => {
    try {
      await API.delete(`/v1/community/delete-video-channel/${channelId}`)

      // Update channels in store
      await get().fetchChannels(communityId)

      return true
    } catch (err) {
      console.error("Error deleting video channel", err)
      set({
        error: err.response?.data?.message || "Failed to delete video channel",
      })
      return false
    }
  },

  fetchMessages: async (channelId) => {
    set({ loading: true })
    try {
      const response = await API.get(`/v1/community/get-messages/${channelId}`)
      set((state) => ({
        messages: {
          ...state.messages,
          [channelId]: response.data.data.messages || [],
        },
        loading: false,
        error: null,
      }))
      return response.data.data.messages
    } catch (err) {
      console.error("Error fetching messages", err)
      set({
        loading: false,
        error: err.response?.data?.message || "Failed to load messages",
      })
      return []
    }
  },

  // Send message using socket.io instead of HTTP
  sendMessage: (channelId, text) => {
    const { user } = useAuthStore.getState()

    if (!channelId || !text.trim()) {
      return null
    }

    const messageData = {
      channel: channelId,
      sender: {
        _id: user?._id,
        username: user?.username,
        avatar: user?.avatar,
      },
      text: text.trim(),
      createdAt: new Date().toISOString(),
      _id: `temp-${Date.now()}`, // Temporary ID until server confirms
    }

    // Emit the message through socket
    socket.emit("send_message", messageData)

    // Stop typing indicator when sending a message
    get().stopTyping(channelId)

    return messageData
  },

  deleteMessage: async (channelId, messageId) => {
    try {
      // Emit delete message event
      socket.emit("delete_message", { messageId, channelId })

      // Optimistically update UI
      set((state) => ({
        messages: {
          ...state.messages,
          [channelId]: state.messages[channelId]?.filter((msg) => msg._id !== messageId) || [],
        },
      }))

      return true
    } catch (err) {
      console.error("Error deleting message", err)
      set({
        error: err.response?.data?.message || "Failed to delete message",
      })
      return false
    }
  },

  editMessage: async (channelId, messageId, text) => {
    try {
      // Emit edit message event
      socket.emit("edit_message", { messageId, channelId, text })

      // Optimistically update UI
      set((state) => ({
        messages: {
          ...state.messages,
          [channelId]: state.messages[channelId]?.map((msg) => (msg._id === messageId ? { ...msg, text } : msg)) || [],
        },
      }))

      return { _id: messageId, text }
    } catch (err) {
      console.error("Error editing message", err)
      set({
        error: err.response?.data?.message || "Failed to edit message",
      })
      return null
    }
  },

  clearError: () => set({ error: null }),
}))
