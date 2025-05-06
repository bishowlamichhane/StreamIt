import mongoose from "mongoose";
const { Schema } = mongoose;

const communitySchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  channels: [{
    type: Schema.Types.ObjectId,
    ref: "CommunityChannel",
  }],
}, { timestamps: true });

export const Community = mongoose.model("Community", communitySchema);
