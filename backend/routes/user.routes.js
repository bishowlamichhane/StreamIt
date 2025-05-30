import express from 'express'
import { upload } from '../middlewares/multer.middleware.js';
import {
        loginUser,
        logoutUser,
        refreshAccessToken,
        registerUser,
        updateUserAvatar,
        updateUserCoverImage,
        changeCurrentPassword,
        getWatchHistory,
        getCurrentUser,
        updateAccountDetails,
        getUserChannelProfile,
        addToWatchHistory,
        removeFromWatchHistory
        } from '../controllers/user.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router=express.Router();

router.route('/register').post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },{
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
)

router.route('/login').post(loginUser)

router.route('/logout').post(verifyJWT,
    logoutUser)

router.route('/refresh-token').post(refreshAccessToken)

router.route('/change-password').post(verifyJWT,changeCurrentPassword)

router.route('/current-user').get(verifyJWT,getCurrentUser)

router.route('/update-details').patch(verifyJWT,updateAccountDetails)

router.route('/avatar').post(
    verifyJWT,
        upload.fields([
            {
                name:"avatar",
                maxCount:1
            }
        ]),
updateUserAvatar)

router.route('/cover-image').post(
    verifyJWT,
        upload.single("coverImage"),
updateUserCoverImage)

router.route('/c/:username').get(getUserChannelProfile)

router.route('/history').get(verifyJWT,
    getWatchHistory
)

router.route("/watch-history").post( verifyJWT, addToWatchHistory);

router.route("/remove-history/:videoId").delete( verifyJWT, removeFromWatchHistory);



export default router;

