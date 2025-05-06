import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";

// index.js
import { Navigate } from "react-router-dom";

import DashboardHome from "./pages/DashboardHome.jsx";
import ChannelVideos from "./pages/channel/videos.jsx";
import ChannelPlaylists from "./pages/channel/playlists.jsx";
import ChannelCommunity from "./pages/channel/community.jsx";
import ChannelAbout from "./pages/channel/about.jsx";
import ChannelLayout from "./pages/channel/ChannelLayout.jsx";
import VideoPlayer from "./pages/VideoPlayer.jsx";
import WatchHistory from "./pages/WatchHistory.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import LikedVideos from "./pages/LikedVideos.jsx";
import CommunityPage from "./pages/CommunityPage.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true, // when user hits "/"
        element: <Navigate to="/dashboard" />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "community-page/:id",
        element: <CommunityPage />,
      },

      {
        path: "dashboard",
        element: <Dashboard />,
        children: [
          { index: true, element: <DashboardHome /> },
          {
            path: "channel/:username/:id",
            element: <ChannelLayout />,
            children: [
              { index: true, element: <ChannelVideos /> },
              { path: "playlists", element: <ChannelPlaylists /> },
              { path: "community", element: <ChannelCommunity /> },
              { path: "about", element: <ChannelAbout /> },
            ],
          },
          {
            path: "history",
            element: <WatchHistory />,
          },
          {
            path: "liked-videos",
            element: <LikedVideos />,
          },

          {
            path: "search",
            element: <SearchPage />,
          },
        ],
      },
      {
        path: "video/:id",
        element: <VideoPlayer />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
