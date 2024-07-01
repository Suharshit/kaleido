import { Router } from "express";
import {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
} from "../controllers/like.controller.js"
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()
router.route('/like-video/:videoId').get(
    verifyJWT,
    toggleVideoLike
)

router.route('/like-tweet/:tweetId').get(
    verifyJWT,
    toggleTweetLike
)

router.route('/like-comment/:commentId').get(
    verifyJWT,
    toggleCommentLike
)

router.route('/liked-videos').get(
    verifyJWT,
    getLikedVideos
)

export default router