    import asyncHandler from '../utils/asyncHandler.js'
    import { User } from "../models/Users.model.js"
    import ApiError from "../utils/ApiError.js"
    import ApiResponse from "../utils/ApiResponse.js"
    import uploadOnCloudinary, { deleteFromCloudinary } from "../utils/cloudinary.js"
    import jwt from 'jsonwebtoken'
    import mongoose from 'mongoose'

    const generateAccessAndRefreshTokens = async (userId) => {
        try {
            //find user by his id
            const user = await User.findById(userId)

            //generate access and refresh tokens
            const accessToken = user.generateAccessToken()
            const refreshToken = user.generateRefreshToken()

            //save refreshtoken in database but since db requires password validations before saving, make that false
            user.refreshToken = refreshToken
            await user.save({ validateBeforeSave: false })


            //return access and refreshtokens to the user 
            return { accessToken, refreshToken }




        } catch (error) {
                throw new ApiError(500, "Error generating Refresh and Access token")
        }
    }


    const registerUser = asyncHandler(async (req, res) => {

        // get user data from frontend
        // validation - not empty
        // validation - existing user
        // check for images, check for avatar
        // upload them to cloudinary
        // create new user object
        // remove password and refreshToken field from response
        // check for user creation
        // return response


        // get user data from frontend
        const { fullName, username, email, password } = req.body;


        // validation - not empty
        if ([fullName, username, email, password].some((field) => field?.trim() === "")) {
            throw new ApiError(400, "All fields are required");
        }

        // validation - existing user
        const existingUser = await User.findOne({
            $or: [{ username, email }]
        });
        if (existingUser) {
            throw new ApiError(409, "User Already exists");
        }

        // check for images, check for avatar
        const avatarLocalPath = req.files?.avatar[0]?.path;

        const coverImagePath = req.files?.coverImage?.[0]?.path;


        //optional way of handling error when no cover image is passed 

        /*  
            let coverImagePath;
            if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
                coverImagePath=req.files.coverImage[0].path 
        */

        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is required");
        }

        // upload them to cloudinary
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        const coverImage = await uploadOnCloudinary(coverImagePath);

        if (!avatar) {
            throw new ApiError(400, "Avatar upload failed");
        }


        // create new user object
        const newUser = await User.create({
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        });


        // remove password and refreshToken field from response
        const userCreated = await User.findById(newUser._id).select(
            "-password -refreshToken"  // Select User without sending password and refreshToken fields
        );

        // check for user creation
        if (!userCreated) {
            throw new ApiError(500, "Something went wrong while registering a user");
        }



        //return response 
        return res.status(201).json(
            new ApiResponse(200, userCreated, "User registered successfully")
        )


    });


    const loginUser = asyncHandler(async (req, res) => {
        //get data from user
        //check if fields are empty
        // check if the user already exists (user check)  
        // if they exist, match their password to grant them access(password check)
        //access and refresh token 
        //send tokens through cookies
        //else tell them to register the new account 
        const { username, password, email } = req.body;


        if (!username && !email) {
            throw new ApiError(400, "Username or Email is required")

        }
        const existingUser = await User.findOne({
            $or: [{ username, email }]
        })
        if (!existingUser) {
            throw new ApiError(400, "User not found")
        }

        const passwordMatch = await existingUser.isPasswordCorrect(password)

        if (!passwordMatch) {
            throw new ApiError(401, " Password Incorrect ")
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(existingUser._id)
    
        const loggedUser = await User.findById(existingUser._id).select(
            "-password -refreshToken"
        )


        //options designing for cookies

        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options) //when sent in cookies, tokens are sent to the database 
            .json(
                new ApiResponse(200,
                    {
                        user: loggedUser,
                        accessToken,
                        refreshToken    //again sending access token ad refresh token in case user wants to save these tokens to himself as well 
                    },
                    "User Logged in Successfully"
                )
            )



    });


    const logoutUser = asyncHandler(async (req, res) => {
        const userId = req.user._id

        await User.findByIdAndUpdate(
            userId,
            {
                $unset: {
                    refreshToken:1
                }
            }, {
            new: true
        }
        )

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "User Logged Out Successfully"))

    });


    const refreshAccessToken = asyncHandler(async (req,res)=>{

    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken    //or used in case mobile users send refreshTOken in body
        if (incomingRefreshToken.split('.').length !== 3) {
            throw new ApiError(400, "Malformed refresh token");
        }
        
        if(!incomingRefreshToken)
            throw new ApiError(401,"Unauthorized request")

        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user)
            throw new ApiError(401,"Invalid refresh token")
    
        if(incomingRefreshToken!==user?.refreshToken)
            throw new ApiError(401,"Refresh Token Does Not Match Stored Token")
        
        const options={
            httpOnly:true,
            secure:true
        }
        const {accessToken,newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        res.status(200).cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json(
            new ApiResponse(200,{
                accessToken, newrefreshToken
            },
            "Access token Refreshed Successfully")
        )
    } catch (error) {
            throw new ApiError(400,error?.message || "Invalid refresh token")
        
    }

    })


    const changeCurrentPassword=asyncHandler(async(req,res)=>{
        const {oldPassword, newPassword}=req.body


        const user= await User.findById(req.user?._id)

        const passwordMatched=await user.isPasswordCorrect(oldPassword)

        if(!passwordMatched)
            throw new ApiError(400,"Invalid password")

        user.password=newPassword
        await user.save({validateBeforeSave:false})


        return res
        .status(200)
        .json(
            new ApiResponse(200,{},"Password Changed Successfully"))
        })

    const getCurrentUser=asyncHandler(async(req,res)=>{

        return res.status(200)
        .json(
            new ApiResponse(200,req.user,"Current User fetched successfully")
        )

    })


    const updateAccountDetails=asyncHandler(async(req,res)=>{

        const {fullName,email} = req.body

        if(!fullName && !email)
            throw new ApiError(400,"All fields are required")

        const user = req.user 
        user.fullName=fullName
        user.email = email
        await user.save({validateBeforeSave:false})

        const newUser = await User.findById(user._id).select("-password -refreshToken")

        return res.status(200)
        .json(
            new ApiResponse(200,user,"Account details updated successfully")
        )
    })


    const updateUserAvatar= asyncHandler(async(req,res)=>{
        const avatar=req.files?.avatar?.[0].path
        
        if(!avatar)
            throw new ApiError(400,"Error receiving image")
    
        const avatarUrl=(await uploadOnCloudinary(avatar)).url
        const oldUser=await User.findById(req.user._id)
        const oldAvatar=oldUser.avatar
        const publicIdName=oldAvatar.split('/').pop()   //it gives filename.jpg 
        const publicId= publicIdName.split('.')[0]      // it gives filename

            
        const user = await User.findByIdAndUpdate(req.user?._id,
            {
                $set:{avatar:avatarUrl}

            },{
                new:true
            }
        ).select("-password -refreshToken")

        await deleteFromCloudinary(publicId)

        if(!user) {
            throw new ApiError(404, "User not found");
        }
        

        return res.status(200).json(
            new ApiResponse(200,user,"Avatar Updated Successfully")
        )
    })

    const updateUserCoverImage = asyncHandler(async (req, res) => {
        const coverImage = req.file?.path;
      
        if (!coverImage)
          throw new ApiError(400, "Error receiving image");
      
        const coverImageUrl = (await uploadOnCloudinary(coverImage)).url;
      
        const user = await User.findByIdAndUpdate(
          req.user?._id,
          { $set: { coverImage: coverImageUrl } },
          { new: true }
        ).select("-password -refreshToken");
      
        if (!user) {
          throw new ApiError(404, "User not found");
        }
      
        return res
          .status(200)
          .json(new ApiResponse(200, user, "CoverImage Updated Successfully"));
      });


    const getUserChannelProfile = asyncHandler(async (req,res)=>{

        const {username}= req.params

        if(!username?.trim()){
            throw new ApiError(404,"Username is missing")
        }

    const channel =  await User.aggregate([
            {
                $match:{
                    username:username.toLowerCase()
                }
            },
            {
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"channel",     /* we look foerign fields as channel, 
                                                because in subscription document channel is used to count the subscribers */
                    as:"subscribers"
                }
            },
            {
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"subscriber",
                    as:"subscribedTo"
                }
            },
            {
                $addFields:{
                    subscribersCount:{
                        $size:"$subscribers"
                    },
                    channelsSubscribedToCount:{
                        $size:"$subscribedTo"
                    },

                    isSubscribed:{
                        $cond:{
                            if: {$in:[req.user?._id, "$subscribers.subscriber"]},   /*$in can look inside arrays as well as objects*/
                            then:true,
                            else:false
                        }
                    }
                }
            },
            {
                $project:{
                    fullName : 1,           //1 for sending the field
                    username: 1,
                    subscribersCount: 1,
                    channelsSubscribedToCount:1,
                    isSubscribed:1,
                    avatar:1,
                    coverImage:1,
                    email:1,


                }
            }

        ])


        if(!channel?.length)
            throw new ApiError(404,"Channel doesnot exist")

        return res
        .status(200)
        .json(
            new ApiResponse(200,channel[0],"User channel fetched successfully")
        )

    })

    const getWatchHistory = asyncHandler(async (req, res) => {
        const user = await User.aggregate([
          {
            $match: {
              _id: new mongoose.Types.ObjectId(req.user._id),
            },
          },
          {
            $lookup: {
              from: "videos",
              localField: "watchHistory",
              foreignField: "_id",
              as: "watchHistory",
              pipeline: [
                {
                  $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                      {
                        $project: {
                          username: 1,
                          fullName: 1,
                          avatar: 1,
                        },
                      },
                    ],
                  },
                },
                {
                  $addFields: {
                    owner: { $first: "$owner" }, // so owner is an object not array
                  },
                },
                {
                  $project: {
                    videoFile: 1,
                    thumbnail: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    views: 1,
                    createdAt: 1,
                    owner: 1,
                  },
                },
                {
                    $sort:{createdAt:-1}
                }
              ],
            },
          },
        ]);
      
        if (!user.length || !user[0].watchHistory.length) {
          throw new ApiError(404, "No videos found in watch history");
        }
      
        return res
          .status(200)
          .json(new ApiResponse(200, user[0].watchHistory, "Successfully retrieved watch history"));
      });
      

    const addToWatchHistory=asyncHandler(async(req,res)=>{
        const userId = req.user._id;
        const {videoId} = req.body;

        await User.findByIdAndUpdate(userId,{
            $addToSet:{watchHistory:videoId}
        });

        res.status(200).json(new ApiResponse(200,null,
        "Added to watch history"
        ))
    })


    const removeFromWatchHistory = asyncHandler(async (req, res) => {
        const userId = req.user._id;
        const { videoId } = req.params;
      
        await User.findByIdAndUpdate(userId, {
          $pull: { watchHistory: videoId }
        });
      
        res.status(200).json(new ApiResponse(200, null, "Removed from watch history"));
      });
      














    export {
        registerUser,
        loginUser,
        logoutUser,
        refreshAccessToken,
        changeCurrentPassword,
        getCurrentUser,
        updateAccountDetails,
        updateUserAvatar,
        updateUserCoverImage,
        getUserChannelProfile,
        getWatchHistory,
        addToWatchHistory,
        removeFromWatchHistory
    }


