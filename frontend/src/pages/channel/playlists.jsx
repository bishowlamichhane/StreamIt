"use client";

import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "@/api";
import { Play } from "lucide-react";
import { Link } from "react-router-dom";
export default function ChannelPlaylists() {
  const { username } = useParams();
  const { id } = useParams();
  const userId = id;
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [selectedPlaylistVideos, setSelectedPlaylistVideos] = useState([]);

  const playlistClicked = async (playlistId) => {
    setSelectedPlaylistId(playlistId);
    setLoading(true);
    try {
      const res = await API.get(`/v1/playlists/getPlaylist/${playlistId}`); // Assuming you have an endpoint like this
      setSelectedPlaylistVideos(res.data.data[0].videoDetails || []);
      console.log(res.data.data[0].videoDetails);
    } catch (err) {
      console.error("Error fetching playlist videos", err);
      // Optionally set an error state here
    } finally {
      setLoading(false); // Stop loading
    }
  };
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        // Assuming you have an API endpoint to fetch channel playlists
        const res = await API.get(`/v1/playlists/getAllPlaylist/${id}`);
        setPlaylists(res.data.data || []);
        console.log(res.data.data);
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

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Playlists</h2>
      {selectedPlaylistId === null ? (
        // Render the list of playlists
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ">
          {playlists.map((playlist) => (
            <div
              key={playlist._id}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => playlistClicked(playlist._id)}
            >
              <div className="aspect-video bg-gray-200 relative">
                <img
                  src={
                    playlist.videos[0].thumbnailUrl ||
                    "/placeholder-playlist.jpg"
                  }
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
      ) : (
        <div>
          <button
            className="mb-4 text-blue-500 hover:underline"
            onClick={() => setSelectedPlaylistId(null)}
          >
            Back to Playlists
          </button>
          <h3 className="text-lg font-semibold mb-2">Videos in Playlist</h3>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedPlaylistVideos.map((video) => (
                <Link
                  to={`/video/${video._id}`}
                  key={video._id}
                  className="bg-white rounded-lg overflow-hidden shadow-sm"
                >
                  {/* Render your video thumbnail and title here */}
                  <div className="aspect-video bg-gray-200">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        No Thumbnail
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-gray-900 line-clamp-2">
                      {video.title}
                    </h4>
                    {video.userDetails && video.userDetails.length > 0 && (
                      <div className="flex items-center mt-1 text-sm text-gray-600">
                        {video.userDetails[0].avatar && (
                          <img
                            src={video.userDetails[0].avatar}
                            alt={video.userDetails[0].username}
                            className="w-6 h-6 rounded-full mr-2 object-cover"
                          />
                        )}
                        <span>{video.userDetails[0].username}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
              {selectedPlaylistVideos.length === 0 && (
                <p>No videos in this playlist yet.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
