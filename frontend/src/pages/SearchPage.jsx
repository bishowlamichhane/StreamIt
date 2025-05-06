import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import API from "@/api";
import dayjs from "dayjs";
import { useAuthStore } from "../store/authStore";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query");
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [others, setOthers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false); // Track subscription status
  const user = useAuthStore((state) => state.user); // Assuming you're using some kind of user context or store
  const navigate = useNavigate();

  useEffect(() => {
    if (!query) return;

    const fetchSearchResults = async () => {
      setLoading(true);

      setChannel(null);
      setVideos([]);
      setOthers([]);

      let foundUser = null;
      try {
        const userRes = await API.get(`/v1/users/c/${query}`);
        foundUser = userRes.data.data;
        setChannel(foundUser);

        // Set subscription status based on fetched user
        setIsSubscribed(foundUser?.isSubscribed);

        // Fetch videos of the found user
        const videoRes = await API.get(
          `/v1/videos/get-videos/${foundUser._id}`
        );
        setVideos(videoRes.data.data);
      } catch (err) {
        console.warn("User not found, continuing with others only.");
      } finally {
        setLoading(false);
      }

      const randomRes = await API.get("/v1/videos/random-videos");
      const filtered = randomRes.data.data.filter(
        (vid) => vid.owner._id !== foundUser?._id
      );
      setOthers(filtered);
    };

    fetchSearchResults();
  }, [query]);

  const handleSubscribe = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const res = await API.post(
        `/v1/subs/sub/${channel?._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        }
      );

      const message = res.data.message;
      if (message === "Subscribed") {
        setIsSubscribed(true);
        setChannel((prevChannel) => ({
          ...prevChannel,
          subscribersCount: prevChannel.subscribersCount + 1,
        }));
      } else if (message === "Unsubscribed") {
        setIsSubscribed(false);
        setChannel((prevChannel) => ({
          ...prevChannel,
          subscribersCount: prevChannel.subscribersCount - 1,
        }));
      }
    } catch (err) {
      console.log("Error with subscription:", err);
    }
  };

  const formatDate = (date) => dayjs(date).fromNow();

  return (
    <div className="p-6 max-w-6xl mx-auto text-foreground">
      <h1 className="text-2xl font-bold mb-6">Search results for “{query}”</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {channel ? (
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Channel</h2>
              <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted hover:bg-accent transition-colors">
                {/* Left side: Avatar + Info */}
                <div className="flex items-center gap-4">
                  <img
                    src={channel.avatar}
                    alt={channel.username}
                    className="w-14 h-14 rounded-full object-cover object-top"
                  />
                  <div>
                    <p className="text-lg font-medium">{channel.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      @{channel.username}
                    </p>
                    <p className="text-sm">
                      {channel.subscribersCount} subscribers
                    </p>
                  </div>
                </div>

                {/* Right side: Subscribe/Unsubscribe Button */}
                <button
                  onClick={handleSubscribe}
                  className={`px-4 py-2 rounded-full text-white font-semibold text-sm cursor-pointer
               ${
                 isSubscribed
                   ? "bg-gray-500 hover:bg-gray-600"
                   : "bg-red-500 hover:bg-red-600"
               }
             `}
                >
                  {isSubscribed ? "Unsubscribe" : "Subscribe"}
                </button>
              </div>
            </section>
          ) : (
            <div className="p-6 rounded-lg text-center border border-1">
              <p className="text-lg font-semibold mb-1">No user found</p>
              <p className="text-sm text-muted-foreground">
                We couldn’t find any channel with the username{" "}
                <span className="font-medium">{query}</span>.
              </p>
            </div>
          )}

          {videos.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Channel Videos</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {videos.map((video) => (
                  <Link
                    to={`/video/${video._id}`}
                    key={video._id}
                    className="hover:opacity-90 transition"
                  >
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="mt-1">
                      <h3 className="font-medium text-sm line-clamp-2">
                        {video.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {video.views} views • {formatDate(video.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {others.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-2">Other Videos</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {others.map((video) => (
                  <Link
                    to={`/video/${video._id}`}
                    key={video._id}
                    className="hover:opacity-90 transition"
                  >
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="mt-1">
                      <h3 className="font-medium text-sm line-clamp-2">
                        {video.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {video.owner.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {video.views} views • {formatDate(video.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
