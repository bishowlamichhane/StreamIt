import { Playlist } from "../models/Playlist.model.js";
import { User} from "../models/Users.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js"
import mongoose from "mongoose";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name } = req.body;
  
    if (!name ) {
      throw new ApiError(400, "All fields are required");
    }
  
    const userId = req.user?._id; // Ensure req.user is populated by your authentication middleware
  
    if (!userId) {
      throw new ApiError(401, "Unauthorized request");
    }
  
    const newPlaylist = await Playlist.create({
      name,
 
      owner: userId,
    });
  
    if (!newPlaylist) {
      throw new ApiError(500, "Error creating playlist");
    }
  
    // Update the user's document to include the new playlist ID
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $push: { playlists: newPlaylist._id },
      },
      { new: true } // To get the updated document back
    );
  
    if (!updatedUser) {
      throw new ApiError(500, "Failed to add playlist to user's account");
    }
  
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { playlist: newPlaylist, user: updatedUser },
          "Playlist created and added to user successfully"
        )
      );
  });
  

const addToPlaylist = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;
    const {name} = req.body;
    const userId = req.user._id
    const playlist = await Playlist.findOne({name,owner:userId})
    console.log(playlist)

    const existingVideo = await playlist.videos.includes(videoId);
    if(existingVideo)
        throw new ApiError(400,"Video already exists in playlist")
    const newPlaylist = await Playlist.findByIdAndUpdate(playlist._id,{
        $push:{
            videos:videoId
        },
        
    },{
        new:true
    })

    return res.status(200).json(new ApiResponse(200,newPlaylist,"Video added to playlist"))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "userDetails"
                        }
                    },
                    {
                        $project: {
                            _id: 1, // Include video _id here
                            title: 1,
                            description: 1,
                            createdAt: 1,
                            videoFile: 1,
                            thumbnail: 1,
                            duration: 1,
                            views: 1,
                            "userDetails.username": 1,
                            "userDetails.email": 1,
                            "userDetails.avatar": 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                name: 1,
                "videoDetails._id": 1, // Also include video _id in outer project
                "videoDetails.title": 1,
                "videoDetails.description": 1,
                "videoDetails.createdAt": 1,
                "videoDetails.videoFile": 1,
                "videoDetails.thumbnail": 1,
                "videoDetails.duration": 1,
                "videoDetails.views": 1,
                "videoDetails.userDetails.username": 1,
                "videoDetails.userDetails.email": 1,
                "videoDetails.userDetails.avatar": 1,
            }
        }
    ])

    if (playlist.length === 0)
        return res.status(200).json(new ApiResponse(200, {}, "No playlist found"))

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist retrieved"))
})


const getAllPlaylists = asyncHandler(async(req,res)=>{
    const {userId} = req.params
    if(!userId)
        throw new ApiError(404,"User not found")
    const playlists = await Playlist.find({
        owner:userId
    })

    return res.status(200).json(new ApiResponse(200,playlists,"Retrieved Playlists"))
})



export {createPlaylist,addToPlaylist,getPlaylistById,getAllPlaylists}