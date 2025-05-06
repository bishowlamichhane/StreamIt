import { getLikedVideos, toggelVideoLike } from "../controllers/likes.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import express from "express"

const likeRouter=express.Router()
likeRouter.route('/like/:videoId').post(verifyJWT,toggelVideoLike)
likeRouter.route('/getLikedVideos/').get(verifyJWT,getLikedVideos)

export default likeRouter