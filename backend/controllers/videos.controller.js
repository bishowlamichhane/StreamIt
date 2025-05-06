
import { Video } from "../models/Videos.model.js";
import {User} from "../models/Users.model.js"
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import { Mongoose } from "mongoose";
import { Like } from "../models/Likes.model.js";


const uploadVideo =asyncHandler(async (req,res)=>{

    const {title,description,category} = req.body

    if(!title && !description && !category)
        throw new ApiError(400,"All fields are required")

    const videoPath= req.files?.videos?.[0].path

    if(!videoPath)
        throw new ApiError(400,"Unable to retrieve video")
    const videoFile = await uploadOnCloudinary(videoPath)
    const videoDuration  = videoFile.duration


    const thumbnailPath = req.files?.thumbnails?.[0].path
    const thumbnail = await uploadOnCloudinary(thumbnailPath)

    const userId= req.user._id

   

    const newVideo = await Video.create({
        videoFile:videoFile.url,
        thumbnail:thumbnail.url,
        title:title,
        category:category,
        description:description,
        duration:videoDuration,
        views:421,
        owner:userId

    })


    const user = await User.findByIdAndUpdate(userId,
        {
            $push:{
                videos:newVideo._id
            }
        }
    )

    if (!newVideo) {
        throw new ApiError(500, "Something went wrong while uploading a video");
    } 

    return res
    .status(201)
    .json(
        new ApiResponse(201,newVideo,"Video Uploaded successfully")

    )



})

const getVideoId = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id; 
  
    const video = await Video.findById(videoId)
      .populate("owner", "username avatar fullName")
      .exec();
  
    if (!video) throw new ApiError(404, "Video could not be found");
  
   
    const likeCount = await Like.countDocuments({ video: videoId });
  
    // Check if the current user has liked it
    let isLikedByUser = false;
    if (userId) {
      isLikedByUser = await Like.exists({ video: videoId, likedBy: userId });
    }
  
    const videoData = {
      ...video.toObject(),
      likeCount,
      isLikedByUser,
    };
  
    return res
      .status(200)
      .json(new ApiResponse(200, videoData, "Video retrieved successfully"));
  });
  

const updateVideo = asyncHandler(async(req,res)=>{
    const {title,description} = req.body

    const {videoId}= req.params
    const thumbnailPath = req.files?.thumbnails?.[0].path
    const thumbnail = (await uploadOnCloudinary(thumbnailPath)).url

    
    
    const oldVideo = await Video.findById(videoId)
    const oldThumbnail = oldVideo.thumbnail
    const publicIdName = oldThumbnail.split('/').pop()
    const publicId = publicIdName.split('.')[0]

    const video = await Video.findByIdAndUpdate(videoId,
        
    {
        $set:{
            title: title || oldVideo.title,
            description:description || oldVideo.description,
            thumbnail:thumbnail || oldVideo.thumbnail
        }
    },{
        new:true
    })

    await deleteFromCloudinary(publicId)
    
    if(!video)
        throw new ApiError(404,"Video not found")


    return res.status(200).json(new ApiResponse(201,video,"Video updated Successfully"))
    
})

const deleteVideo = asyncHandler(async (req,res)=>{


    const {videoId} = req.params
    const video = await Video.findById(videoId)
    if(!video)
        throw new ApiError(404,"Video not found")

    const videoFileUrl= video.videoFile  
    const videoIdPath = videoFileUrl.split('/').pop()
    const videoIdtoDelete = videoIdPath.split('.')[0]

    const thumbnailUrl = video.thumbnail
    const thumbnailPathtoDelete = thumbnailUrl.split('/').pop()
    const thumbnailId = thumbnailPathtoDelete.split('.')[0]

    
    await Video.findByIdAndDelete(videoId)

    await deleteFromCloudinary(videoIdtoDelete)
    await deleteFromCloudinary(thumbnailId)

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Video deleted successfully")
    )

   

})

const searchVideos = asyncHandler(async (req, res) => {
    const { keyword } = req.query;
  
    if (!keyword || keyword.trim() === "") {
      throw new ApiError(400, "Search keyword is required");
    }
  
    const videos = await Video.find({
      title: { $regex: keyword, $options: "i" }, 
    })
      .populate("owner", "fullName avatar")
      .sort({ createdAt: -1 });
  
    return res
      .status(200)
      .json(new ApiResponse(200, videos, "Matching videos found"));
  });
  


const getAllVideos = asyncHandler(async(req,res)=>{
    const {id} = req.params


    if(!id)
        throw new ApiError(400,"Yser not found")

    const user = await User.findById(id).select("-password -refreshToken")

    if(!user)
        throw new ApiError(400,"User not found")

    const videos = await Video.find({owner:id}).sort({createdAt:-1})

    return res.status(200).json(new ApiResponse(200,videos,"Videos Retrieved SAuccessfully"))
    

})


const togglePublishStatus = asyncHandler(async (req,res)=>{

    const {videoId} = req.params
    const video = await Video.findById(videoId)

    if(!video)
        throw new ApiError(404,"Video not found")

    video.isPublished = !video.isPublished

    await video.save()
    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"Video publish status updated")
    )




})

const getRandomVideos=asyncHandler(async(req,res)=>{

    const videos = await Video.aggregate([
        {
            $match:{isPublished:true}
        },
        {
            $sample:{size:20}
        },

        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{username:1,avatar:1,fullName:1}
                    }
                ]
            }
        },
        {
            $addFields:{
                owner:{$first:"$owner"}
            }
        },
        {
            $project:{
                videoFile:1,
                thumbnail:1,
                title:1,
                description:1,
                duration:1,
                views:1,
                createdAt:1,
                owner:1
            }
        }
    ])

    if(!videos)
        throw new ApiError(400,"Failed to load videos");
    return res.status(200).json(new ApiResponse(200,videos, "Random Videos Fetched Successfully"));


})


export {uploadVideo,getVideoId,updateVideo,deleteVideo,getAllVideos,togglePublishStatus,getRandomVideos,searchVideos}
