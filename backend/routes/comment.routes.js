import express from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { deleteComment, editComment, getAllComments, uploadComment } from '../controllers/comments.controller.js'

const commentRouter = express.Router()

commentRouter.route("/add/:videoId").post(verifyJWT,uploadComment)
commentRouter.route('/edit').patch(editComment)
commentRouter.route('/get/:videoId').get(getAllComments)
commentRouter.route('/delete').delete(deleteComment)
export default commentRouter