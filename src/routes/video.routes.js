import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { 
    publishVideo, 
    getAllVideos, 
    getVideoById, 
    updateVideoInformation, 
    deleteVideo,
    togglePublishStatus
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()
router.route('/publish').post(
    upload.fields([
        {
            name: 'video',
            maxCount: 1
        },
        {
            name: 'thumbnail',
            maxCount: 1
        }
    ]),
    verifyJWT,
    publishVideo
)

router.route('/videos').get(
    getAllVideos
)

router.route('/v/:videoId').get(
    getVideoById
)

router.route('/updatevideoinfo/:videoId').patch(
    verifyJWT,
    updateVideoInformation
)

router.route('/deletevideo/:videoId').get(
    verifyJWT,
    deleteVideo
)

router.route('/publishstatus/:videoId').get(
    verifyJWT,
    togglePublishStatus
)
export default router