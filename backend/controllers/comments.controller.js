import { Video } from "../models/Videos.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Comment } from "../models/Comments.model.js";
import mongoose from "mongoose";

const uploadComment= asyncHandler(async(req,res)=>{

    const {videoId} = req.params
    const {commentText} = req.body

    if(!commentText || commentText.trim()==="")
        throw new ApiError(400,"Comment cannot be empty")

    const video = await Video.findById(videoId)
    
    if(!video)
        throw new ApiError(404,"Video couldn't be found")

    const user = req.user

    if(!user)
        throw new ApiError(404,"User not found")

    const newComment = new Comment({
        content:commentText,
        video:videoId,
        owner:user._id
    })
    await newComment.save()
  
    return res
    .status(201)
    .json(
        new ApiResponse(201,newComment,"Comment added Successfully")
    )


})

const editComment = asyncHandler(async(req,res)=>{
   
    const {commentId} = req.body
    const {newContent} = req.body
   
    if(!newContent) 
        throw new ApiError(400,"Comment field cannot be empty")

    const existingComment = await Comment.findByIdAndUpdate(commentId,{
       
        $set:{
            content:newContent
        },
    },
    {
        new:true
    }
)



         return res
         .status(200)
         .json(
            new ApiResponse(200,existingComment,"Comment updated Successfully")
            )
})

const deleteComment = asyncHandler(async(req,res)=>{
    const {commentId} = req.body
    
    if(!commentId)
        throw new ApiError(404,"Comment not found")

    await Comment.findByIdAndDelete(commentId)

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Comment deleted ")
    )



})

const getAllComments = asyncHandler(async(req,res)=>{
    const {videoId} = req.params


   

    const comments  = await Video.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"comments",
                localField:"_id",
                foreignField:"video",
                as:"comments",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"ownerDetails",
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        email:1,
                                        avatar:1,
                                    }
                                }
                            ]
                            
                        }
                    },
                    {
                        $project:{
                            content:1,
                            createdAt:1,
                            'ownerDetails.username':1,
                            'ownerDetails.email':1,
                            'ownerDetails.avatar':1
                        }
                    }
                    
                
                
            ],

            }
        }
    ])

    if(!comments)
        throw new ApiError(400,"Comments couldnt be retrieved")

    if(comments.length===0)
        return res.status(200).json(new ApiResponse(200,comments,"No comments yet"))
    return res.status(200)
    .json(
        new ApiResponse(200,comments[0].comments,'Comments retrieved successfully')
    )


})


export {uploadComment,editComment,deleteComment,getAllComments}


