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
  peerConnection: null,
localStream: null,


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
    socket.off("webrtc_signal");  // clean previous listeners

    socket.on("webrtc_signal", ({ signalData, senderId }) => {
      // Call your handler function here (we'll define it next)
      const handleWebRTCSignal = get().handleWebRTCSignal;
      if (handleWebRTCSignal) {
        handleWebRTCSignal(signalData, senderId);
      }
    });
    
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
  // Handle incoming WebRTC signals
handleWebRTCSignal: async (signalData, senderId) => {
  const { peerConnection, localStream, activeChannel } = get();

  if (!peerConnection && localStream) {
    await get().createPeerConnection(localStream);
  }

  if (signalData.sdp) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
    if (signalData.sdp.type === 'offer') {
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("webrtc_signal", { channelId: activeChannel, signalData: { sdp: answer }, senderId: socket.id });
    }
  }

  if (signalData.candidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(signalData.candidate));
  }
},

// Initialize Peer Connection & Local Audio
createPeerConnection: async (stream) => {
  const { activeChannel } = get();
  const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

  stream.getTracks().forEach(track => pc.addTrack(track, stream));

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("webrtc_signal", { channelId: activeChannel, signalData: { candidate: event.candidate }, senderId: socket.id });
    }
  };

  pc.ontrack = (event) => {
    const remoteAudio = new Audio();
    remoteAudio.srcObject = event.streams[0];
    remoteAudio.autoplay = true;
    remoteAudio.play();
  };

  set({ peerConnection: pc });
},

// Join voice channel (start stream + signaling)
joinVoiceChannel: async () => {
  const { activeChannel } = get();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  set({ localStream: stream });

  await get().createPeerConnection(stream);

  // Create Offer
  const pc = get().peerConnection;
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.emit("webrtc_signal", { channelId: activeChannel, signalData: { sdp: offer }, senderId: socket.id });
},

// Leave voice channel (cleanup)
leaveVoiceChannel: () => {
  const { peerConnection, localStream } = get();

  if (peerConnection) {
    peerConnection.close();
  }

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }

  set({ peerConnection: null, localStream: null });
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
