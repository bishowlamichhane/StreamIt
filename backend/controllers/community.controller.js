import { Community } from "../models/Community.model.js"
import ApiError from "../utils/ApiError.js"
import asyncHandler from "../utils/asyncHandler.js"
import { CommunityChannel } from "../models/CommunityChannels.model.js"
import { CommunityMessage } from "../models/CommunityMessageSchema.model.js"
import { Video } from "../models/Videos.model.js" // Assuming you have a Video model
import ApiResponse from "../utils/ApiResponse.js"

const createCommunity = asyncHandler(async (req, res) => {
  const { name } = req.body
  const userId = req.user?._id

  if (!userId) throw new ApiError(401, "Unauthorized")

  const existing = await Community.findOne({ owner: userId })
  if (existing) throw new ApiError(400, "You already own a community")

  const community = await Community.create({
    name,
    owner: userId,
    channels: [],
  })

  // Create general text channel
  const generalChannel = await CommunityChannel.create({
    community: community._id,
    name: "general",
    isVoice: false,
    type: "text",
  })

  // Create voice study channel
  const voiceChannel = await CommunityChannel.create({
    community: community._id,
    name: "voice-study",
    isVoice: true,
    type: "voice",
  })

  // Add welcome message to general channel
  const msg = await CommunityMessage.create({
    channel: generalChannel._id,
    sender: req.user._id,
    text: `Welcome to ${name}'s community!`,
  })

  generalChannel.messages.push(msg._id)
  await generalChannel.save()

  // Add channels to community
  community.channels.push(generalChannel._id, voiceChannel._id)
  await community.save()

  res.status(201).json({
    success: true,
    message: "Community created successfully",
    data: community,
  })
})

const getCommunityByChannelId = asyncHandler(async (req, res) => {
  const { channelId } = req.params

  const community = await Community.findOne({ owner: channelId }).populate({
    path: "channels",
    populate: {
      path: "linkedVideo",
      select: "title thumbnail",
    },
  })

  if (!community) throw new ApiError(404, "Community not found")

  return res.status(200).json(new ApiResponse(200, community, "Community Fetched"))
})

const deleteCommunity = asyncHandler(async (req, res) => {
  const { communityId } = req.params

  // Delete related channels
  await CommunityChannel.deleteMany({ community: communityId })

  // Then delete the community
  await Community.findByIdAndDelete(communityId)

  return res.status(200).json(new ApiResponse(200, {}, "Community deleted"))
})

// Create a new video channel
const createVideoChannel = asyncHandler(async (req, res) => {
  const { communityId, videoId } = req.body
  const userId = req.user?._id

  if (!userId) throw new ApiError(401, "Unauthorized")
  if (!communityId) throw new ApiError(400, "Community ID is required")
  if (!videoId) throw new ApiError(400, "Video ID is required")

  // Check if community exists and user is the owner
  const community = await Community.findById(communityId)
  if (!community) throw new ApiError(404, "Community not found")

  if (community.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "Only community owner can create video channels")
  }

  // Check if video exists
  const video = await Video.findById(videoId)
  if (!video) throw new ApiError(404, "Video not found")

  // Check if channel for this video already exists
  const existingChannel = await CommunityChannel.findOne({
    community: communityId,
    linkedVideo: videoId,
    type: "video",
  })

  if (existingChannel) {
    throw new ApiError(400, "Channel for this video already exists")
  }

  // Create new video channel
  const videoChannel = await CommunityChannel.create({
    community: communityId,
    name: video.title || "Video Chat",
    isVoice: false,
    type: "video",
    linkedVideo: videoId,
  })

  // Add channel to community
  community.channels.push(videoChannel._id)
  await community.save()

  return res.status(201).json(new ApiResponse(201, videoChannel, "Video channel created successfully"))
})

// Get all video channels for a community
const getVideoChatChannels = asyncHandler(async (req, res) => {
  const { communityId } = req.params

  const community = await Community.findById(communityId)
  if (!community) throw new ApiError(404, "Community not found")

  const videoChannels = await CommunityChannel.find({
    community: communityId,
    type: "video",
  }).populate({
    path: "linkedVideo",
    select: "title thumbnail",
  })

  return res.status(200).json(new ApiResponse(200, videoChannels, "Video channels fetched successfully"))
})

// Delete a video channel
const deleteVideoChannel = asyncHandler(async (req, res) => {
  const { channelId } = req.params
  const userId = req.user?._id

  if (!userId) throw new ApiError(401, "Unauthorized")

  const channel = await CommunityChannel.findById(channelId)
  if (!channel) throw new ApiError(404, "Channel not found")

  if (channel.type !== "video") {
    throw new ApiError(400, "This is not a video channel")
  }

  // Check if user is community owner
  const community = await Community.findById(channel.community)
  if (!community) throw new ApiError(404, "Community not found")

  if (community.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "Only community owner can delete channels")
  }

  // Remove channel from community
  await Community.findByIdAndUpdate(channel.community, { $pull: { channels: channelId } })

  // Delete all messages in the channel
  await CommunityMessage.deleteMany({ channel: channelId })

  // Delete the channel
  await CommunityChannel.findByIdAndDelete(channelId)

  return res.status(200).json(new ApiResponse(200, {}, "Video channel deleted successfully"))
})

// Send a message to a specific channel
const uploadGeneralMessage = asyncHandler(async (req, res) => {
  const { channelId, text } = req.body
  const sender = req.user?._id

  if (!sender) throw new ApiError(401, "Unauthorized")
  if (!channelId) throw new ApiError(400, "Channel ID is required")
  if (!text || text.trim() === "") throw new ApiError(400, "Message text is required")

  // Find the channel
  const channel = await CommunityChannel.findById(channelId)
  if (!channel) throw new ApiError(404, "Channel not found")

  // Check if it's a voice channel
  if (channel.isVoice) throw new ApiError(400, "Cannot send text messages to voice channels")

  // Create the message
  const message = await CommunityMessage.create({
    channel: channelId,
    sender,
    text,
  })

  // Add message to channel
  channel.messages.push(message._id)
  await channel.save()

  // Populate sender details for the response
  const populatedMessage = await CommunityMessage.findById(message._id).populate({
    path: "sender",
    select: "username fullName avatar",
  })

  return res.status(201).json(new ApiResponse(201, populatedMessage, "Message sent successfully"))
})

// Get messages for a specific channel
const getChannelMessages = asyncHandler(async (req, res) => {
  const { channelId } = req.params
  const { page = 1, limit = 50 } = req.query

  const channel = await CommunityChannel.findById(channelId)
  if (!channel) throw new ApiError(404, "Channel not found")

  // Check if it's a voice channel
  if (channel.isVoice) throw new ApiError(400, "Voice channels don't have text messages")

  const options = {
    page: Number.parseInt(page, 10),
    limit: Number.parseInt(limit, 10),
    sort: { createdAt: -1 }, // Newest first
    populate: {
      path: "sender",
      select: "username fullName avatar",
    },
  }

  // Get messages with pagination
  const messages = await CommunityMessage.find({ channel: channelId })
    .sort({ createdAt: -1 })
    .skip((options.page - 1) * options.limit)
    .limit(options.limit)
    .populate(options.populate)

  // Get total count for pagination
  const totalMessages = await CommunityMessage.countDocuments({ channel: channelId })

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          total: totalMessages,
          page: options.page,
          limit: options.limit,
          pages: Math.ceil(totalMessages / options.limit),
        },
      },
      "Messages fetched successfully",
    ),
  )
})

// Delete a message
const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params
  const userId = req.user?._id

  if (!userId) throw new ApiError(401, "Unauthorized")

  const message = await CommunityMessage.findById(messageId)
  if (!message) throw new ApiError(404, "Message not found")

  // Check if user is the sender of the message
  if (message.sender.toString() !== userId.toString()) {
    // Check if user is community owner
    const channel = await CommunityChannel.findById(message.channel)
    if (!channel) throw new ApiError(404, "Channel not found")

    const community = await Community.findById(channel.community)
    if (!community) throw new ApiError(404, "Community not found")

    if (community.owner.toString() !== userId.toString()) {
      throw new ApiError(403, "You don't have permission to delete this message")
    }
  }

  // Remove message from channel
  await CommunityChannel.findByIdAndUpdate(message.channel, { $pull: { messages: messageId } })

  // Delete the message
  await CommunityMessage.findByIdAndDelete(messageId)

  return res.status(200).json(new ApiResponse(200, {}, "Message deleted successfully"))
})

// Edit a message
const editMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params
  const { text } = req.body
  const userId = req.user?._id

  if (!userId) throw new ApiError(401, "Unauthorized")
  if (!text || text.trim() === "") throw new ApiError(400, "Message text is required")

  const message = await CommunityMessage.findById(messageId)
  if (!message) throw new ApiError(404, "Message not found")

  // Only the sender can edit the message
  if (message.sender.toString() !== userId.toString()) {
    throw new ApiError(403, "You don't have permission to edit this message")
  }

  // Update the message
  message.text = text
  await message.save()

  // Populate sender details for the response
  const populatedMessage = await CommunityMessage.findById(messageId).populate({
    path: "sender",
    select: "username fullName avatar",
  })

  return res.status(200).json(new ApiResponse(200, populatedMessage, "Message updated successfully"))
})

// Get all channels for a community
const getCommunityChannels = asyncHandler(async (req, res) => {
  const { communityId } = req.params

  const community = await Community.findById(communityId)
  if (!community) throw new ApiError(404, "Community not found")

  const channels = await CommunityChannel.find({ community: communityId }).populate({
    path: "linkedVideo",
    select: "title thumbnail",
  })

  // Return a flat array instead of grouping by type
  // This ensures backward compatibility with existing frontend code
  return res.status(200).json(new ApiResponse(200, channels, "Channels fetched successfully"))
})

export {
  createCommunity,
  getCommunityByChannelId,
  deleteCommunity,
  createVideoChannel,
  getVideoChatChannels,
  deleteVideoChannel,
  uploadGeneralMessage,
  getChannelMessages,
  deleteMessage,
  editMessage,
  getCommunityChannels,
}
