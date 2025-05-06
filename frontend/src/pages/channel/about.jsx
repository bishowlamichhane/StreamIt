"use client";

import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "@/api";
import {
  Calendar,
  Flag,
  Share2,
  Mail,
  MapPin,
  LinkIcon,
  ExternalLink,
} from "lucide-react";

export default function ChannelAbout() {
  const { username } = useParams();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChannel = async () => {
      try {
        const res = await API.get(`/v1/users/c/${username}`);
        setChannel(res.data.data);
      } catch (err) {
        console.error("Error fetching channel", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChannel();
  }, [username]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-gray-200 rounded-lg h-48 mb-6"></div>
            <div className="bg-gray-200 rounded-lg h-32"></div>
          </div>
          <div className="md:col-span-1">
            <div className="bg-gray-200 rounded-lg h-40 mb-6"></div>
            <div className="bg-gray-200 rounded-lg h-24"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="p-6 text-center text-red-500">Channel not found.</div>
    );
  }

  // Use placeholder data if needed
  const channelData = {
    ...channel,
    description:
      channel.description ||
      "Welcome to my channel! I create videos about technology, programming, and digital content creation. Subscribe for weekly tutorials and behind-the-scenes content.",
    joinedDate: channel.joinedDate || "Jan 15, 2020",
    location: channel.location || "San Francisco, CA",
    totalViews: channel.totalViews || "1.2M",
    links: channel.links || [
      { title: "Website", url: "https://example.com" },
      { title: "Twitter", url: "https://twitter.com/example" },
      { title: "Instagram", url: "https://instagram.com/example" },
    ],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <div className="w-1 h-6 bg-blue-600 mr-3"></div>
            Description
          </h2>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
            {channelData.description}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <div className="w-1 h-6 bg-blue-600 mr-3"></div>
            Details
          </h2>
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="bg-blue-50 p-2 rounded-full mr-4">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Location</h3>
                <p className="text-gray-700">{channelData.location}</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-green-50 p-2 rounded-full mr-4">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Joined</h3>
                <p className="text-gray-700">{channelData.joinedDate}</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-purple-50 p-2 rounded-full mr-4">
                <Flag className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Total Views
                </h3>
                <p className="text-gray-700">{channelData.totalViews}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="md:col-span-1">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <div className="w-1 h-6 bg-blue-600 mr-3"></div>
            Links
          </h2>
          <div className="space-y-4">
            {channelData.links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-3" />
                <span className="flex-1">{link.title}</span>
                <LinkIcon className="w-3 h-3 text-gray-400" />
              </a>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center">
            <div className="w-1 h-5 bg-blue-600 mr-3"></div>
            Contact
          </h2>
          <div className="space-y-4">
            <button className="flex items-center text-gray-700 hover:text-gray-900 hover:bg-gray-50 p-2 rounded-lg w-full transition-colors">
              <Share2 className="w-5 h-5 mr-3 text-gray-500" />
              Share Channel
            </button>
            <button className="flex items-center text-gray-700 hover:text-gray-900 hover:bg-gray-50 p-2 rounded-lg w-full transition-colors">
              <Mail className="w-5 h-5 mr-3 text-gray-500" />
              Send Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
