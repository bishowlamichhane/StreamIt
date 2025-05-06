import mongoose, { Schema } from "mongoose";

const communityMessageSchema = new mongoose.Schema({
    channel: {
      type: Schema.Types.ObjectId,
      ref: "CommunityChannel",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  }, { timestamps: true });
  

  export const CommunityMessage = mongoose.model("CommunityMessage",communityMessageSchema)