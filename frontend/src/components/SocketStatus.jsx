"use client";

import { useState, useEffect } from "react";
import { socket } from "../store/socket";
import { Wifi, WifiOff } from "lucide-react";

export default function SocketStatus() {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    // Update connection status when socket connects or disconnects
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // Check initial connection status
    setIsConnected(socket.connected);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs">
      {isConnected ? (
        <>
          <Wifi size={14} className="text-green-500" />
          <span className="text-green-500">Connected</span>
        </>
      ) : (
        <>
          <WifiOff size={14} className="text-red-500" />
          <span className="text-red-500">Disconnected</span>
        </>
      )}
    </div>
  );
}
