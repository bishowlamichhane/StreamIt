import mongoose from "mongoose";
import { Like } from "../models/Likes.model.js";
import { User } from "../models/Users.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const toggelVideoLike = asyncHandler(async(req,res)=>{

    const userId = req.user._id;
    const {videoId} = req.params

    const existingLike = await Like.findOne({
        video:videoId,
        likedBy:userId
    }) 

    if(existingLike)
    {
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(
            new ApiResponse(200,existingLike,"Like Removed")
        )
    }


    else{
        const newLike = new Like({
            video:videoId,
            likedBy:userId
        })

        await newLike.save()
        return res.status(200).json(new ApiResponse(200,newLike,"Like Added"))
    }


})


const getLikedVideos = asyncHandler(async(req,res)=>{

    const user = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"likedBy",
                as:"likedVideos",
                pipeline:[
                    {
                        $lookup:{
                            from:"videos",
                            localField:"video",
                            foreignField:"_id",
                            as:"videoDetails",
                            pipeline:[
                                {
                                    $lookup:
                                    {
                                    from:"users",
                                    localField:"owner",
                                    foreignField:"_id",
                                    as:"owner",
                                    pipeline:[
                                        {
                                            $project:{
                                                username:1,
                                                avatar:1,
                                                fullName:1
                                            }
                                        }
                                    ]
                                }
                                },
                                {
                                    $addFields:{
                                        owner:{
                                            $first:"$owner"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])


    if(!user){
        throw new ApiError(404,"User not found")
    }

    if(user[0].likedVideos.length === 0){
        return res.status(200).json(
            new ApiResponse(200,[],"No Liked Videos found") 
        )
    }

    return res.status(200).json(new ApiResponse(200,user[0].likedVideos,"Liked videos retrieved successfully"))




})

export {toggelVideoLike,getLikedVideos}