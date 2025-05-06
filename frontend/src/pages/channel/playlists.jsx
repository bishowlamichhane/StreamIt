"use client";

import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "@/api";
import { Play } from "lucide-react";

export default function ChannelPlaylists() {
  const { username } = useParams();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        // Assuming you have an API endpoint to fetch channel playlists
        const res = await API.get(`/v1/users/c/${username}/playlists`);
        setPlaylists(res.data.data || []);
      } catch (err) {
        console.error("Error fetching playlists", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, [username]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If no playlists are available, use placeholder data
  const placeholderPlaylists = [
    {
      id: 1,
      title: "Tutorials",
      videoCount: 12,
      thumbnail: "/placeholder-playlist.jpg",
    },
    {
      id: 2,
      title: "Behind the Scenes",
      videoCount: 5,
      thumbnail: "/placeholder-playlist.jpg",
    },
    {
      id: 3,
      title: "Product Reviews",
      videoCount: 8,
      thumbnail: "/placeholder-playlist.jpg",
    },
    {
      id: 4,
      title: "Live Streams",
      videoCount: 3,
      thumbnail: "/placeholder-playlist.jpg",
    },
  ];

  const displayPlaylists =
    playlists.length > 0 ? playlists : placeholderPlaylists;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Playlists</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayPlaylists.map((playlist) => (
          <div
            key={playlist.id}
            className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="aspect-video bg-gray-200 relative">
              <img
                src={playlist.thumbnail || "/placeholder-playlist.jpg"}
                alt={playlist.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <button className="bg-white bg-opacity-90 rounded-full p-3">
                  <Play size={24} className="text-red-600" />
                </button>
              </div>
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                {playlist.videoCount} videos
              </div>
            </div>
            <div className="p-3">
              <h3 className="font-medium line-clamp-1">{playlist.title}</h3>
              <p className="text-sm text-gray-500 mt-1">View full playlist</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
