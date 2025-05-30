import dotenv from "dotenv"
import express from "express"
import connectDB from "./db/index.js"
import app from "./app.js"
import http from "http"
import { Server } from "socket.io"
import { CommunityMessage } from "./models/CommunityMessageSchema.model.js"
// Load environment variables first
dotenv.config({
  path: "./.env",
})

// Create HTTP server
const server = http.createServer(app)

// Get environment variables
const port = process.env.PORT || 8000
const corsOrigin = process.env.CORS_ORIGIN || "*"

// Initialize Socket.io with proper CORS configuration
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST", "PATCH"],
    credentials: true,
  },
})

// Track online users by community
const onlineUsers = new Map() // communityId -> Set of user objects

// Socket.io connection handling
io.on("connection", (socket) => {
  // Store user data in socket for later use
  let currentUser = null
  let currentCommunity = null

  // User authentication and presence
  socket.on("authenticate", async (userData) => {
    try {
      if (!userData || !userData._id) {
        return
      }

      // Store user data in socket
      currentUser = userData

      // If user is already in a community, update their presence
      if (currentCommunity) {
        updateUserPresence(currentCommunity, currentUser, true)
      }
    } catch (error) {
      console.error("Error authenticating user:", error)
    }
  })

  // Join a community
  socket.on("join_community", async (communityId) => {
    if (!communityId) return

    try {
      // Leave previous community if any
      if (currentCommunity && currentCommunity !== communityId) {
        socket.leave(`community:${currentCommunity}`)
        updateUserPresence(currentCommunity, currentUser, false)
      }

      // Join new community room
      currentCommunity = communityId
      socket.join(`community:${communityId}`)

      // Update user presence if authenticated
      if (currentUser) {
        updateUserPresence(communityId, currentUser, true)
      }
    } catch (error) {
      console.error("Error joining community:", error)
    }
  })

  // Leave a community
  socket.on("leave_community", (communityId) => {
    if (communityId) {
      socket.leave(`community:${communityId}`)

      // Update user presence if authenticated
      if (currentUser) {
        updateUserPresence(communityId, currentUser, false)
      }

      if (currentCommunity === communityId) {
        currentCommunity = null
      }
    }
  })

  // Join a specific channel
  socket.on("join_channel", (channelId) => {
    if (channelId) {
      socket.join(channelId)
    }
  })

  // Leave a specific channel
  socket.on("leave_channel", (channelId) => {
    if (channelId) {
      socket.leave(channelId)
    }
  })

  // Handle message sending
  socket.on("send_message", async (data) => {
    try {
      // Save message to database if needed
      if (data.channel && data.text && data.sender) {
        const newMsg = new CommunityMessage({
          channel: data.channel,
          sender: data.sender._id,
          text: data.text,
        })

        const savedMessage = await newMsg.save()

        // Populate sender details
        const populatedMessage = await CommunityMessage.findById(savedMessage._id).populate({
          path: "sender",
          select: "username fullName avatar",
        })

        // Send to everyone INCLUDING the sender
        io.to(data.channel).emit("receive_message", populatedMessage)
      } else {
        // For messages without proper data, just relay them
        if (data.channel) {
          // Send to everyone EXCEPT the sender to avoid duplicates
          socket.to(data.channel).emit("receive_message", data)
        } else {
          // Send to everyone EXCEPT the sender to avoid duplicates
          socket.broadcast.emit("receive_message", data)
        }
      }
    } catch (error) {
      console.error("Error handling message:", error)
      socket.emit("error", { message: "Failed to process message" })
    }
  })

  // Handle message deletion
  socket.on("delete_message", async ({ messageId, channelId }) => {
    try {
      if (messageId) {
        await CommunityMessage.findByIdAndDelete(messageId)
        io.to(channelId).emit("message_deleted", { messageId, channelId })
      }
    } catch (error) {
      console.error("Error deleting message:", error)
      socket.emit("error", { message: "Failed to delete message" })
    }
  })

  // Handle message editing
  socket.on("edit_message", async ({ messageId, channelId, text }) => {
    try {
      if (messageId && text) {
        const updatedMessage = await CommunityMessage.findByIdAndUpdate(messageId, { text }, { new: true }).populate({
          path: "sender",
          select: "username fullName avatar",
        })

        io.to(channelId).emit("message_updated", updatedMessage)
      }
    } catch (error) {
      console.error("Error editing message:", error)
      socket.emit("error", { message: "Failed to edit message" })
    }
  })

  // Handle user typing status
  socket.on("typing_start", ({ channelId, user }) => {
    if (channelId && user) {
      socket.to(channelId).emit("user_typing", { channelId, user })
    }
  })

  socket.on("typing_stop", ({ channelId, user }) => {
    if (channelId && user) {
      socket.to(channelId).emit("user_stopped_typing", { channelId, user })
    }
  })

  socket.on("disconnect", () => {
    // Update user presence when disconnected
    if (currentUser && currentCommunity) {
      updateUserPresence(currentCommunity, currentUser, false)
    }
  })

  // Helper function to update user presence
  function updateUserPresence(communityId, user, isOnline) {
    if (!user || !communityId) return

    try {
      // Initialize community's online users set if it doesn't exist
      if (!onlineUsers.has(communityId)) {
        onlineUsers.set(communityId, new Set())
      }

      const communityUsers = onlineUsers.get(communityId)

      if (isOnline) {
        // Add user to online users
        communityUsers.add(user)
      } else {
        // Remove user from online users
        communityUsers.delete(user)
      }

      // Convert Set to Array for sending to clients
      const onlineUsersArray = Array.from(communityUsers)

      // Broadcast updated online users to all clients in the community
      io.to(`community:${communityId}`).emit("online_users_updated", onlineUsersArray)
    } catch (error) {
      console.error("Error updating user presence:", error)
    }
  }
})

// Connect to MongoDB and start the server
connectDB()
  .then(() => {
    // Important: Use 'server.listen' instead of 'app.listen'
    server.listen(port, () => {

    })
  })
  .catch((err) => {
    console.log("MongoDB connection FAILED!!", err)
  })