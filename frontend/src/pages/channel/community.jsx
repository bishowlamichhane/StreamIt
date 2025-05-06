"use client";

import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "@/api";
import {
  Users,
  MessageSquare,
  Share2,
  ArrowRight,
  Plus,
  Loader2,
} from "lucide-react";
import { clsx } from "@/lib/utils";

export default function ChannelCommunity() {
  const { username } = useParams();
  const { id } = useParams();

  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/v1/community/get-community/${id}`);
        setCommunity(res.data.data || null);
        setError(null);
      } catch (err) {
        console.error("Error fetching community", err);
        setError("Failed to load community data");
      } finally {
        setLoading(false);
      }
    };

    fetchCommunity();
  }, [id]);

  const handleCreateCommunity = () => {
    navigate(`/create-community/${id}`);
  };

  const handleExploreCommunity = () => {
    navigate(`/community-page/${id}`);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full">
        <div className="flex flex-col items-center justify-center h-48 space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading community...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full">
        <div className="flex flex-col items-center justify-center h-48 space-y-4">
          <div className="text-destructive text-center">
            <p className="text-lg font-medium">Something went wrong</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full">
      <h2 className="text-xl font-bold mb-4 border-b pb-2">Community</h2>

      {community ? (
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{community.name}</h3>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                <div className="flex items-center">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  <span>{community.channels?.length || 0} channels</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  <span>Members: {community.members?.length || 1}</span>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {community.description ||
                  "Join this community to chat with other members and participate in discussions."}
              </p>
            </div>
          </div>

          <button
            onClick={handleExploreCommunity}
            className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-md transition-colors cursor-pointer"
          >
            <span>Explore Community</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center pt-2">
            <button
              onClick={() => {
                // Share functionality
                if (navigator.share) {
                  navigator.share({
                    title: community.name,
                    text: `Check out this community: ${community.name}`,
                    url: window.location.href,
                  });
                } else {
                  // Fallback - copy to clipboard
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard!");
                }
              }}
              className="flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <Share2 className="w-4 h-4 mr-1" />
              <span>Share Community</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
            <Users className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium">No Community Created</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create a community to connect with your audience and build a space
              for discussions.
            </p>
          </div>
          <button
            onClick={handleCreateCommunity}
            className={clsx(
              "mt-4 flex items-center justify-center space-x-2",
              "bg-primary hover:bg-primary/90 text-primary-foreground",
              "py-3 px-6 rounded-md transition-colors"
            )}
          >
            <Plus className="w-4 h-4" />
            <span>Create Community</span>
          </button>
        </div>
      )}
    </div>
  );
}
