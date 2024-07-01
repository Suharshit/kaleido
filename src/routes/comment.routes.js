import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    addComment,
    deleteComment,
    updateComment,
    getComments
} from "../controllers/comment.controller.js"

const router = Router()
router.route('/add-comment/:videoId').post(
    verifyJWT,
    addComment
)

router.route('/update-comment/:commentId').post(
    verifyJWT,
    updateComment
)

router.route('/delete-comment/:commentId').get(
    verifyJWT,
    deleteComment
)

router.route('/get-comments/:videoId').get(
    verifyJWT,
    getComments
)

export default router