import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import API from "../api";
import { Link } from "react-router-dom";

function LikedVideos() {
  const [likedVideos, setLikedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const fetchLikedVideos = async () => {
      try {
        const response = await API.get("/v1/likes/getLikedVideos", {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        });
        setLikedVideos(response?.data.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load liked videos.");
      } finally {
        setLoading(false);
      }
    };

    fetchLikedVideos();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Liked Videos</h2>
      {likedVideos.length === 0 ? (
        <p>No liked videos found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 ">
          {likedVideos.map(({ videoDetails }) => {
            const video = videoDetails[0];
            const owner = video?.owner || {};

            return (
              <div
                key={video?._id}
                className=" bg-card  rounded-lgoverflow-hidden shadow hover:shadow-md transition duration-300"
              >
                <div className="w-full h-48 bg-black">
                  <Link to={`/video/${video?._id}`}>
                    <img
                      src={video?.thumbnail || "/default-thumbnail.jpg"}
                      alt={video?.title}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-base mb-2">
                    {video?.title}
                  </h3>

                  <Link
                    to={`/dashboard/channel/${video?.owner.username}/${video?.owner._id}`}
                    className="flex items-center gap-3 mb-1"
                  >
                    <img
                      src={owner.avatar || "/default-avatar.png"}
                      alt={owner.fullName || "Channel"}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <p className="text-sm text-gray-700">
                      {owner.fullName || "Unknown Creator"}
                    </p>
                  </Link>
                  <p className="text-xs text-gray-500">
                    {video?.views || 0} views
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LikedVideos;
