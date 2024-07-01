import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {
    getChannelStats,
    getChannelvideos
} from "../controllers/dashboard.controller.js"

const router = Router()

router.route("/get-stats/:channelId").get(
    verifyJWT,
    getChannelStats
)

router.route("/get-channel-video/:channelId").get(
    verifyJWT,
    getChannelvideos
)

export default router