import { asyncHandler } from "../utils/asyncHandler";
import { apiError } from "../utils/apiError";
import { apiResponse } from "../utils/apiResponse";
import { Video } from "../modals/video.modal.js"
import { Like } from "../modals/like.modal.js"
import { Subscription } from "../modals/subscriptions.modal.js"
import { Tweet } from '../modals/tweet.modal.js'

// getChannelStats
const getChannelStats = asyncHandler(async(req, res) => {
    const { channelId } = req.params;
    // totalVideoVeiws
    const videoViews = await Video.aggregate([
        {
            $match: {
                owner: channelId
            }
        },
        {
            $group: {
                _id: "$owner",
                totalVideoViews: { $sum: "$views" }
            }
        },
        {
            $project: {
                _id: 0,
                totalVideoViews: 1
            }
        }
    ])

    // totalVideoLikes
    const videoLikes = await Like.aggregate([
        {
            $match: {
                video: {
                    $in: [channelId]
                }
            }
        },
        {
            $group: {
                _id: "$video",
                totalVideoLikes: { $sum: "$likes" }
            }
        },
        {
            $project: {
                _id: 0,
                totalVideoLikes: 1
            }
        }
    ])

    // totalSubscriber
    const subscriber = await Subscription.aggregate([
        {
            $match: {
                channel: channelId
            }
        },
        {
            $group: {
                _id: "$channel",
                totalSubscriber: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                totalSubscriber: 1
            }
        }
    ])

    // totalVideo
    const videos = await Video.aggregate([
        {
            $match: {
                owner: channelId
            }
        },
        {
            $group: {
                _id: "$owner",
                totalVideo: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                totalVideo: 1
            }
        }
    ])

    // totalTweets
    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: channelId
            }
        },
        {
            $group: {
                _id: "$owner",
                totalTweet: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                totalTweet: 1
            }
        }
    ])

    if(!(videoViews || videoLikes || videos || tweets || subscriber)){
        throw new apiError({
            status: 400,
            message: "No data found",
        })
    }

    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Data fetched successfully",
            data: {
                videoViews: videoViews[0].totalVideo,
                videoLikes: videoLikes[0].totalVideo,
                videos: videos.length,
                subscriber: subscriber,
                tweets: tweets[0].totalTweet
            }
        })
    )

})

// getChannelvideos
const getChannelvideos = asyncHandler(async(req, res) => {
    const { channelId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const videos = await Video.find({
        owner: channelId
    }).sort({
        createdAt: -1
    }).select({
        _id: 1,
        title: 1,
        description: 1,
        thumbnail: 1,
        views: 1,
    }).skip(
        (page - 1) * limit
    )
    if(!videos){
        throw new apiError({
            status: 400,
            message: "No videos found",
        })
    }
    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Data fetched successfully",
            data: videos
        })
    )
})
export {
    getChannelStats,
    getChannelvideos
}