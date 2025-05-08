"use client";

import { useState, useRef } from "react";
import { useUploadModal } from "@/store/modalStore";
import API from "../api";
import { useAuthStore } from "@/store/authStore";
import {
  X,
  Upload,
  Video,
  AlertCircle,
  Check,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { clsx } from "@/lib/utils";

const UploadModal = () => {
  const { isOpen, closeModal } = useUploadModal();
  const user = useAuthStore((state) => state.user);
  const toast = useToast();
  const fileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const [videoData, setVideoData] = useState({
    title: "",
    description: "",
    video: null,
    category: "",
    thumbnail: null,
  });

  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setVideoData((prev) => ({ ...prev, [name]: files[0] }));

      // Create preview URLs for video and thumbnail
      if (name === "video" && files[0]) {
        setVideoPreview(URL.createObjectURL(files[0]));
      } else if (name === "thumbnail" && files[0]) {
        setThumbnailPreview(URL.createObjectURL(files[0]));
      }
    } else {
      setVideoData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && !videoData.video) {
      toast.error("Please select a video file");
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleUpload = async (e) => {
    if (e) e.preventDefault();

    if (!videoData.video || !videoData.title || !videoData.category) {
      toast.error("Please fill all required fields");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("title", videoData.title);
    formData.append("description", videoData.description);
    formData.append("category", videoData.category);
    formData.append("videos", videoData.video);

    if (videoData.thumbnail) {
      formData.append("thumbnails", videoData.thumbnail);
    }

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + Math.random() * 10;
          return newProgress >= 95 ? 95 : newProgress;
        });
      }, 500);

      const res = await API.post("/v1/videos/upload-video", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user.accessToken}`,
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success("Video uploaded successfully!");

      // Reset form after successful upload
      setTimeout(() => {
        resetForm();
        closeModal();
      }, 1500);
    } catch (err) {
      console.error("Upload failed", err);
      toast.error(err.response?.data?.message || "Failed to upload video");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setVideoData({
      title: "",
      description: "",
      video: null,
      category: "",
      thumbnail: null,
    });
    setVideoPreview(null);
    setThumbnailPreview(null);
    setUploadProgress(0);
    setCurrentStep(1);

    // Clear file inputs
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  };

  const handleClose = () => {
    if (uploading) {
      const confirmClose = window.confirm(
        "Upload in progress. Are you sure you want to cancel?"
      );
      if (!confirmClose) return;
    }
    resetForm();
    closeModal();
  };

  if (!isOpen) return null;

  const categories = [
    { value: "Music", label: "Music" },
    { value: "Gaming", label: "Gaming" },
    { value: "Entertainment", label: "Entertainment" },
    { value: "Education", label: "Education" },
    { value: "Sports", label: "Sports" },
    { value: "Tech", label: "Technology" },
    { value: "News", label: "News & Politics" },
    { value: "Howto", label: "How-to & Style" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-2xl rounded-xl shadow-xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold text-card-foreground">
            Upload Video
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-muted transition-colors text-card-foreground"
            disabled={uploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div
                className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center font-medium",
                  currentStep >= 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                1
              </div>
              <div
                className={clsx(
                  "h-1 w-12",
                  currentStep >= 2 ? "bg-primary" : "bg-muted"
                )}
              ></div>
              <div
                className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center font-medium",
                  currentStep >= 2
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                2
              </div>
              <div
                className={clsx(
                  "h-1 w-12",
                  currentStep >= 3 ? "bg-primary" : "bg-muted"
                )}
              ></div>
              <div
                className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center font-medium",
                  currentStep >= 3
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                3
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of 3
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1">
            {/* Step 1: Select Video */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-card-foreground">
                  Select Video File
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose a video file to upload. Supported formats: MP4, MOV,
                  AVI, WebM.
                </p>

                {!videoData.video ? (
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="font-medium text-card-foreground">
                      Click to select a video
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or drag and drop a file
                    </p>
                    <p className="text-xs text-muted-foreground mt-4">
                      Maximum file size: 500MB
                    </p>
                  </div>
                ) : (
                  <div className="border border-border rounded-lg p-4 bg-background/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Video className="w-5 h-5 text-primary mr-2" />
                        <span className="font-medium truncate max-w-[300px] text-card-foreground">
                          {videoData.video.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          setVideoData((prev) => ({ ...prev, video: null }));
                          setVideoPreview(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(videoData.video.size / (1024 * 1024)).toFixed(2)} MB
                    </div>

                    {videoPreview && (
                      <div className="mt-4 aspect-video bg-black rounded-md overflow-hidden">
                        <video
                          src={videoPreview}
                          className="w-full h-full object-contain"
                          controls
                        />
                      </div>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  name="video"
                  accept="video/*"
                  onChange={handleChange}
                  className="hidden"
                />
              </div>
            )}

            {/* Step 2: Video Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-card-foreground">
                  Video Details
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add information about your video to help viewers find it.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                      Title <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="text"
                      name="title"
                      placeholder="Add a title that describes your video"
                      value={videoData.title}
                      onChange={handleChange}
                      required
                      className="w-full bg-background text-foreground border-border"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      placeholder="Tell viewers about your video"
                      value={videoData.description}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                      Category <span className="text-destructive">*</span>
                    </label>
                    <select
                      name="category"
                      value={videoData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Thumbnail */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-card-foreground">
                  Add Thumbnail
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a custom thumbnail or use an auto-generated one.
                </p>

                {!videoData.thumbnail ? (
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => thumbnailInputRef.current?.click()}
                  >
                    <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="font-medium text-card-foreground">
                      Click to select a thumbnail
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or drag and drop an image
                    </p>
                    <p className="text-xs text-muted-foreground mt-4">
                      Recommended: 1280×720 (16:9)
                    </p>
                  </div>
                ) : (
                  <div className="border border-border rounded-lg p-4 bg-background/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <ImageIcon className="w-5 h-5 text-primary mr-2" />
                        <span className="font-medium truncate max-w-[300px] text-card-foreground">
                          {videoData.thumbnail.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          setVideoData((prev) => ({
                            ...prev,
                            thumbnail: null,
                          }));
                          setThumbnailPreview(null);
                          if (thumbnailInputRef.current)
                            thumbnailInputRef.current.value = "";
                        }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {thumbnailPreview && (
                      <div className="mt-2 aspect-video bg-black rounded-md overflow-hidden">
                        <img
                          src={thumbnailPreview || "/placeholder.svg"}
                          className="w-full h-full object-contain"
                          alt="Thumbnail preview"
                        />
                      </div>
                    )}
                  </div>
                )}

                <input
                  ref={thumbnailInputRef}
                  type="file"
                  name="thumbnail"
                  accept="image/*"
                  onChange={handleChange}
                  className="hidden"
                />

                <div className="mt-4 text-sm text-muted-foreground">
                  <div className="flex items-start">
                    <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <p>
                      A good thumbnail stands out and draws viewers' attention.
                      Use high-resolution images with minimal text.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-card-foreground">
                    Uploading video...
                  </span>
                  <span className="text-sm text-card-foreground">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {uploadProgress < 100
                    ? "Please don't close this window while your video is uploading"
                    : "Upload complete! Processing video..."}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border flex justify-between bg-card sticky bottom-0">
            <div>
              {currentStep > 1 && !uploading ? (
                <Button type="button" variant="outline" onClick={prevStep}>
                  Back
                </Button>
              ) : (
                <div></div> // Empty div to maintain layout
              )}
            </div>

            <div>
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={currentStep === 1 && !videoData.video}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleUpload}
                  disabled={
                    uploading ||
                    !videoData.title ||
                    !videoData.category ||
                    !videoData.video
                  }
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : uploadProgress === 100 ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Complete
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Video
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
