import express from "express"
import {  getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const subsRouter= express.Router()

subsRouter.route("/sub/:channelId").post( verifyJWT,toggleSubscription)



subsRouter.route("/subCount/:channelId").get(verifyJWT,getUserChannelSubscribers)
export default subsRouter;