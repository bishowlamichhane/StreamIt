"use client";

import { useState } from "react";
import API from "@/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Camera, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EditProfileForm({ currentData, onSuccess }) {
  const [form, setForm] = useState({
    fullName: currentData.fullName || "",
    email: currentData.email || "",
    avatar: null,
    coverImage: null,
  });
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(
    currentData.avatar || null
  );
  const [coverPreview, setCoverPreview] = useState(
    currentData.coverImage || null
  );
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setForm((prev) => ({ ...prev, [name]: files[0] }));

      // Create preview URL
      if (name === "avatar" && files[0]) {
        setAvatarPreview(URL.createObjectURL(files[0]));
      } else if (name === "coverImage" && files[0]) {
        setCoverPreview(URL.createObjectURL(files[0]));
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fullName = form.fullName.trim();
      const email = form.email.trim();

      // 1. Update fullName & email
      await API.patch("/v1/users/update-details", { fullName, email });

      // 2. Update avatar
      if (form.avatar) {
        const avatarForm = new FormData();
        avatarForm.append("avatar", form.avatar);
        await API.patch("/v1/users/avatar", avatarForm);
      }

      // 3. Update cover image
      if (form.coverImage) {
        const coverForm = new FormData();
        coverForm.append("coverImage", form.coverImage);
        await API.post("/v1/users/cover-image", coverForm);
      }

      toast.success("Profile updated successfully");
      onSuccess();
    } catch (err) {
      console.error("Error updating profile", err);
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <Input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
              className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <Input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded-lg"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Avatar
            </label>
            <div className="flex items-center gap-4">
              {avatarPreview && (
                <div className="relative w-16 h-16 rounded-full overflow-hidden">
                  <img
                    src={avatarPreview || "/placeholder.svg"}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <Camera className="w-5 h-5" />
                <span>Choose Avatar</span>
                <Input
                  type="file"
                  name="avatar"
                  accept="image/*"
                  onChange={handleChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cover Image
            </label>
            <div className="flex items-center gap-4">
              {coverPreview && (
                <div className="relative w-24 h-12 rounded overflow-hidden">
                  <img
                    src={coverPreview || "/placeholder.svg"}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <Upload className="w-5 h-5" />
                <span>Choose Cover</span>
                <Input
                  type="file"
                  name="coverImage"
                  accept="image/*"
                  onChange={handleChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
      >
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
