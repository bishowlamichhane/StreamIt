import { useState } from "react";
import { useUploadModal } from "@/store/modalStore";
import API from "../api";
import { useAuthStore } from "@/store/authStore";

const UploadModal = () => {
  const { isOpen, closeModal } = useUploadModal();
  const user = useAuthStore((state) => state.user);

  const [videoData, setVideoData] = useState({
    title: "",
    description: "",
    video: null,
    category: "",
    thumbnail: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setVideoData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setVideoData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", videoData.title);
    formData.append("description", videoData.description);
    formData.append("category", videoData.category);
    formData.append("videos", videoData.video);
    formData.append("thumbnails", videoData.thumbnail);

    try {
      const res = await API.post("/v1/videos/upload-video", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user.accessToken}`,
        },
      });
      closeModal();
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 backdrop-blur-sm bg-black/40 flex items-center justify-center">
      <div className="bg-card p-6 rounded-lg w-[90%] md:w-[500px] relative border border-border shadow-lg">
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          ✖
        </button>
        <h2 className="text-xl font-semibold mb-4">Upload a Video</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <input
            type="text"
            name="title"
            placeholder="Title"
            value={videoData.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-border rounded-md"
          />
          <textarea
            name="description"
            placeholder="Description"
            value={videoData.description}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-border rounded-md min-h-[100px]"
          ></textarea>
          <input
            type="file"
            name="video"
            accept="video/*"
            onChange={handleChange}
            required
            className="cursor-pointer border border-1"
          />
          <input
            type="file"
            name="thumbnail"
            accept="image/*"
            onChange={handleChange}
            required
            className="cursor-pointer border border-1"
          />
          <select
            name="category"
            value={videoData.category}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-border rounded-md cursor-pointer"
          >
            <option value="">Select category</option>
            <option value="Music">Music</option>
            <option value="Gaming">Gaming</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Education">Education</option>
            <option value="Sports">Sports</option>
            <option value="Tech">Tech</option>
          </select>
          <button
            type="submit"
            className="w-full py-2 bg-primary text-white rounded hover:bg-primary/90 cursor-pointer"
          >
            Upload
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
