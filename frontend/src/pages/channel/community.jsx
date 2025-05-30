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
  AlertCircle,
} from "lucide-react";
import { clsx } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

export default function ChannelCommunity() {
  const { username } = useParams();
  const { id } = useParams();

  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        setLoading(true);
        setError(null); // Reset error state before fetching

        const res = await API.get(`/v1/community/get-community/${id}`);

        // Check if the response contains valid community data
        if (
          res.data &&
          res.data.data &&
          Object.keys(res.data.data).length > 0
        ) {
          setCommunity(res.data.data);
        } else {
          // Explicitly set community to null if no data is returned
          setCommunity(null);
        }
      } catch (err) {
        console.error("Error fetching community", err);
        // Set community to null on error to show the create button
        setCommunity(null);
        setError("Failed to load community data");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCommunity();
    } else {
      setLoading(false);
      setCommunity(null);
    }
  }, [id]);

  const handleCreateCommunity = () => {
    if (!isLoggedIn) {
      toast.error("Please login to access community features");
      navigate("/login");
      return;
    }
    // Navigate to the community register page
    navigate("/community-register");
  };

  const handleExploreCommunity = () => {
    if (!isLoggedIn) {
      toast.error("Please login to access community features");
      navigate("/login");
      return;
    }
    navigate(`/community-page/${id}`);
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg shadow-md p-6 w-full border border-border">
        <div className="flex flex-col items-center justify-center h-48 space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading community...</p>
        </div>
      </div>
    );
  }

  // Show error state with option to create community
  if (error) {
    return (
      <div className="bg-card rounded-lg shadow-md p-6 w-full border border-border">
        <h2 className="text-xl font-bold mb-4 border-b pb-2 border-border">
          Community
        </h2>

        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>

          <div className="text-center">
            <h3 className="text-lg font-medium text-destructive">
              Something went wrong
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors"
            >
              Try Again
            </button>

            <button
              onClick={handleCreateCommunity}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Community</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-md p-6 w-full border border-border">
      <h2 className="text-xl font-bold mb-4 border-b pb-2 border-border">
        Community
      </h2>

      {community ? (
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-card-foreground">
                {community.name}
              </h3>
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
                  toast.success("Link copied to clipboard!");
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
            <h3 className="text-lg font-medium text-card-foreground">
              No Community Created
            </h3>
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
