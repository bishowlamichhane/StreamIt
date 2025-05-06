import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'
import { User } from "../models/Users.model.js";

export const verifyJWT = asyncHandler(async(req, _ ,next)=>{ //here _ means res field is not used so we can use _ to denote it

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    
        if(!token){     
            throw new ApiError(401,"Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)   // decode the data by verifying i the secret key matches the  token's signature 
        
    
       const user =  await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        )
    
        if(!user){
    
            throw new ApiError(401,"Invalid Access Token")
        }

        
        
        req.user=user;
        next();
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token")
        
    }


})