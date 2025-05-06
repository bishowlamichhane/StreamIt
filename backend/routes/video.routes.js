import express from 'express'
import {uploadVideo, getVideoId, updateVideo, deleteVideo, getAllVideos, togglePublishStatus, getRandomVideos, searchVideos} from '../controllers/videos.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const videoRouter = express.Router()



videoRouter.route('/upload-video').post(

    verifyJWT,
        upload.fields([
    {        name:'videos',
             maxCount:1
    },
    {
        name:"thumbnails",
        maxCount:1
    }]), uploadVideo
)

videoRouter.route('/update/:videoId').patch(
  
    upload.fields([
        {
            name:"thumbnails",
            maxCount:1
        }
    ]),
    updateVideo
)

videoRouter.route('/v/:videoId').get(getVideoId)

videoRouter.route('/delete/:videoId').delete(deleteVideo)


videoRouter.route('/get-videos/:id').get(verifyJWT,getAllVideos)

videoRouter.route('/publish/:videoId').patch(togglePublishStatus)
videoRouter.route("/random-videos").get( getRandomVideos);

videoRouter.route("/search").get(searchVideos)
export default videoRouter
    