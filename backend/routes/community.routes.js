import express from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { createCommunity, createVideoChannel, deleteCommunity, deleteMessage, deleteVideoChannel, editMessage, getChannelMessages, getCommunityByChannelId, getCommunityChannels, getVideoChatChannels, uploadGeneralMessage } from "../controllers/community.controller.js"
const commRouter = express.Router()



commRouter.route("/create-community").post(verifyJWT,createCommunity)
commRouter.route("/get-community/:channelId").get(verifyJWT,getCommunityByChannelId)
commRouter.route("/delete-community/:channelId").delete(verifyJWT,deleteCommunity)
commRouter.route("/get-channels/:communityId").get(verifyJWT,getCommunityChannels)

commRouter.route("/video-channel").post(verifyJWT,createVideoChannel);
commRouter.route("/video-channels/:communityId").get(verifyJWT,getVideoChatChannels);
commRouter.route("/delete-video-channel/:channelId").delete(verifyJWT,deleteVideoChannel)

commRouter.route("/message").post(verifyJWT,uploadGeneralMessage)
commRouter.route("/get-messages/:channelId").get(verifyJWT,getChannelMessages)
commRouter.route("/delete-message/:messageId").delete(verifyJWT,deleteMessage);
commRouter.route("/edit-message/:messageId").patch(verifyJWT,editMessage);






export default commRouter;