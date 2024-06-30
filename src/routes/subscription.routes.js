import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    toggleSubscription, 
    getSubscribers, 
    getSubscriptions 
} from '../controllers/subscription.controller.js'

const router = Router()
router.route('/toggle-subscription/:channelId').get(
    verifyJWT,
    toggleSubscription
)

router.route('/get-subscribers/:channelId').get(
    verifyJWT,
    getSubscribers
)

router.route('/get-subscriptions/:subscriberId').get(
    verifyJWT,
    getSubscriptions
)

export default router