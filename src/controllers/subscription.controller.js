import mongoose from "mongoose";
import { asyncHandler } from '../utils/asyncHandler.js'
import { apiError } from '../utils/apiError.js'
import { apiResponse } from '../utils/apiResponse.js'
import { User } from '../modals/user.modal.js'
import { Subscription } from '../modals/subscriptions.modal.js'

// toggle subscription
const toggleSubscription = asyncHandler(async(req, res) => {
    const { channelId } = req.params;
    const subscription = await Subscription.findOne({
        channel: channelId
    })
    if(channelId.toString() === req.user._id.toString()){
        throw new apiError({
            status: 400,
            message: "You can't subscribe to yourself"
        })
    }
    console.log(req.user._id);
    if (!subscription) {
        const subCreated = await Subscription.create({
            channel: channelId,
            subscriber: req.user?._id
        })
        if(!subCreated){
            throw new apiError(500, 'Error while creating subscription')
        }
        
        return res.status(200)
        .json(
            new apiResponse(
                200,
                'Subscription created successfully',
                subCreated
            )
        )
    }
    if (subscription.subscriber.toString() === req.user._id.toString()) {
        const subscriptionRemoved = await Subscription.findOneAndDelete({
            channel: channelId,
        })
        if(!subscriptionRemoved){
            throw new apiError(500, 'Error while removing subscription')
        }
        return res.status(200)
        .json(
            new apiResponse({
                status: 200,
                message: 'Subscription removed successfully',
            })
        )
    }
})

// get list of subscribers of a channel
const getSubscribers = asyncHandler(async(req, res) => {
    const { channelId } = req.params;
    const subscribers = await Subscription.find({
        channel: channelId
    }).populate({
        path: 'subscriber',
        select: 'username fullname avatar'
    }).populate({
        path: 'channel',
        select: 'username fullname avatar'
    })
    console.log(subscribers);
    if(!subscribers){
        throw new apiError(404, 'No subscribers found')
    }
    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: 'Subscribers fetched successfully',
            data: subscribers
        })
    )
})

// get list of subscriptions of a user
const getSubscriptions = asyncHandler(async(req, res) => {
    const { subscriberId } = req.params;
    const subscriptions = await Subscription.find({
        subscriber: subscriberId
    }).populate({
        path: 'channel',
        select: 'username fullname avatar coverImage'
    }).populate({
        path: 'subscriber',
        select: 'username fullname avatar'
    })
    if(!subscriptions){
        throw new apiError(404, 'No subscriptions found')
    }
    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: 'Subscriptions fetched successfully',
            data: subscriptions
        })
    )
})

export {
    toggleSubscription,
    getSubscribers,
    getSubscriptions
}