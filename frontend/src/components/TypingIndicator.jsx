"use client";

import { useCommunityStore } from "../store/communityStore";
import { useEffect, useState } from "react";

export default function TypingIndicator({ channelId }) {
  const { typingUsers } = useCommunityStore();
  const [displayText, setDisplayText] = useState("");

  const channelTypingUsers = typingUsers[channelId] || [];

  useEffect(() => {
    if (channelTypingUsers.length === 0) {
      setDisplayText("");
    } else if (channelTypingUsers.length === 1) {
      setDisplayText(`${channelTypingUsers[0].username} is typing...`);
    } else if (channelTypingUsers.length === 2) {
      setDisplayText(
        `${channelTypingUsers[0].username} and ${channelTypingUsers[1].username} are typing...`
      );
    } else {
      setDisplayText(`${channelTypingUsers.length} people are typing...`);
    }
  }, [channelTypingUsers]);

  if (!displayText) return null;

  return (
    <div className="px-4 py-1 text-xs text-muted-foreground italic">
      {displayText}
      <span className="typing-animation">
        <span className="dot">.</span>
        <span className="dot">.</span>
        <span className="dot">.</span>
      </span>
    </div>
  );
}
