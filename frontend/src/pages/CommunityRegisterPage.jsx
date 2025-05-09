import React from "react";
import API from "../api";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
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
  X,
  Menu,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
const CommunityRegisterPage = () => {
  const [communityName, setCommunityName] = useState("");
  const [communityDescription, setCommunityDescription] = useState("");
  const navigate = useNavigate();
  const toast = useToast();
  const [creatingCommunity, setCreatingCommunity] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateCommunity = async (e) => {
    e.preventDefault();

    if (!communityName.trim()) {
      toast.error("Community name is required");
      return;
    }

    setCreatingCommunity(true);

    try {
      // Make the API call to create the community
      const res = await API.post("/v1/community/create-community", {
        name: communityName,
      });
      const fetchedCommunity = res.data.data;
      navigate(`/community-page/${fetchedCommunity.owner}`);

      setCommunityName("");
      setShowCreateForm(false);
    } catch (error) {
      toast.error("Failed to create community");
      console.error("Error creating community:", error);
    } finally {
      setCreatingCommunity(false);
    }
  };

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
          <div className="max-w-4xl mx-auto px-4">
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
                    You don't have a community yet. Create your own community to
                    connect with your audience, host discussions, and share
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

                  <form onSubmit={handleCreateCommunity} className="space-y-6">
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
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
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
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px] text-foreground"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
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
};

export default CommunityRegisterPage;
