import mongoose, { Schema } from "mongoose"

const communityChannelSchema = new mongoose.Schema(
  {
    community: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    isVoice: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ["text", "video", "voice"],
      default: "text",
    },
    linkedVideo: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      default: null, // Only if this is a Video Chatroom
    },
    messages: [
      {
        type: Schema.Types.ObjectId,
        ref: "CommunityMessage",
      },
    ],
  },
  { timestamps: true },
)

export const CommunityChannel = mongoose.model("CommunityChannel", communityChannelSchema)
