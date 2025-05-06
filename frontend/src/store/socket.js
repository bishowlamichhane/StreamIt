import { io } from "socket.io-client"

// Get the API URL from environment variables
const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

// Create a socket instance with proper configuration
export const socket = io(API_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ["websocket", "polling"],
})

// Socket event listeners for debugging
socket.on("connect", () => {
})

socket.on("disconnect", (reason) => {
})

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error.message)
})

// Export a function to manually connect if needed
export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect()
  }
}
