"use client";

import { useState } from "react";
import { useCommunityStore } from "../store/communityStore";

export default function OnlineUsersList() {
  const { onlineUsers } = useCommunityStore();
  const [searchQuery, setSearchQuery] = useState("");

  // Deduplicate users based on _id
  const uniqueUsers = Array.from(
    new Map(onlineUsers.map((user) => [user._id, user])).values()
  );

  // Filter users based on search query
  const filteredUsers = searchQuery
    ? uniqueUsers.filter((user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : uniqueUsers;

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="p-2">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-sidebar-accent/30 border border-sidebar-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Users list */}
      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length > 0 ? (
          <div className="space-y-1 p-2">
            {filteredUsers.map((user) => (
              <div
                key={user?._id}
                className="flex items-center p-2 rounded-md hover:bg-sidebar-accent/30 transition-colors"
              >
                <div className="relative">
                  <img
                    src={user.avatar || "/placeholder.svg?height=32&width=32"}
                    alt={user.username}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <span className="absolute bottom-0 right-1 w-3 h-3 bg-green-500 border-2 border-sidebar rounded-full"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.username}
                  </p>
                  {user.status && (
                    <p className="text-xs text-sidebar-foreground/70 truncate">
                      {user.status}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-sidebar-foreground/50 text-sm">
            {searchQuery ? "No users found" : "No users online"}
          </div>
        )}
      </div>
    </div>
  );
}
