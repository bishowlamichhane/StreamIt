import express from "express"

import { verifyJWT } from "../middlewares/auth.middleware.js"
import { addToPlaylist, createPlaylist, getAllPlaylists, getPlaylistById } from "../controllers/playlist.controller.js"
const playlistRouter  = express.Router()


playlistRouter.route("/create-playlist").post(verifyJWT,createPlaylist)
playlistRouter.route("/addVideo/:videoId").post(verifyJWT,addToPlaylist)
playlistRouter.route("/getPlaylist/:playlistId").get(getPlaylistById)
playlistRouter.route("/getAllPlaylist/:userId").get(getAllPlaylists)

export default playlistRouter