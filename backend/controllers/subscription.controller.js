
import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { Subscription } from "../models/Subscription.model.js"

import mongoose from "mongoose"

const toggleSubscription = asyncHandler(async(req,res)=>{


  const {channelId} = req.params
    const userId = req.user._id
  const isSubscribed = await Subscription.findOne({
    channel:channelId,
    subscriber:userId
  })
  if(isSubscribed){
    await Subscription.findByIdAndDelete(isSubscribed._id)

    return res.status(200).json(new ApiResponse(200,{},"Unsubscribed"))
  } 
  else{
    const newSubscriber = new Subscription({
        channel:channelId,
        subscriber:userId
    })
    await newSubscriber.save()
    return res.status(200).json(new ApiResponse(200,{},"Subscribed"))
  }

})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    const channel = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribersDetails"
            }
        },
        {
            $project: {
                _id: 0,
                channel:1,
                subscribersDetails: {
                    username: 1,
                    avatar: 1,
                    fullName: 1
                }
            }
        },
        {
            $group: {
                _id: "$channel", // Grouping by the channel ID
                subscribers: { $push: "$subscribersDetails" },
                subsCount: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                channelId: "$_id",
                subscribers: 1,
                subsCount: 1
            }
        }
    ]);

    if (!channel || channel.length === 0) {
        throw new ApiError(404, "Channel not found or no subscribers");
    }

    return res.status(200).json(
        new ApiResponse(200, channel[0], "Channel subscribers found")
    );
});


export {toggleSubscription,getUserChannelSubscribers}