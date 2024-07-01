import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { Tweet } from "../modals/tweet.modal.js"
import { User } from "../modals/user.modal.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// createTweet
const createTweet = asyncHandler(async(req, res) => {
    const { content } = req.body
    const tweet = await Tweet.create({
        content: content,
        owner: req.user._id
    })
    if(!tweet){
        throw new apiError({
            status: 400,
            message: "Tweet not created"
        })
    }
    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Tweet created successfully",
            data: tweet
        })
    )
})

// getUserTweet
const getUserTweet = asyncHandler(async(req, res) => {
    const tweets = await Tweet.find({
        owner: req.user?._id
    }).sort({
        createdAt: -1
    }).populate({
        path: "owner",
        select: "username avatar"
    })
    if(!tweets){
        throw new apiError({
            status: 400,
            message: "No tweets found"
        })
    }
    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Tweets fetched successfully",
            data: tweets
        })
    )
})

// updateTweet
const updateTweet = asyncHandler(async(req, res) => {
    const { tweetId } = req.params
    const { content } = req.body
    const updatedTweet = await Tweet.findOneAndUpdate({
        _id: tweetId
    },
    {
        $set:{
            content: content
        }
    },
    {
        new: true
    })
    if(!updatedTweet){
        throw new apiError({
            status: 400,
            message: "Tweet not found"
        })
    }
    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Tweet updated successfully",
            data: updatedTweet
        })
    )
})

// deleteTweet
const deleteTweet = asyncHandler(async(req, res) => {
    const { tweetId } = req.params
    const deletedTweet = await Tweet.findByIdAndDelete({
        _id: tweetId
    })
    if(!deletedTweet){
        throw new apiError({
            status: 400,
            message: "Tweet not found"
        })
    }
    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Tweet deleted successfully",
        })
    )
})

// getTweetByUsernameOrContent
const getTweetByUsernameOrContent = asyncHandler(async(req, res) => {
    const { page = 1, limit = 10, text = ' ' } = req.query
    const tweets = await Tweet.aggregate([
        {
            $match: {
                $or: [
                    { username: { $regex: text, $options: 'i' } },
                    { content: { $regex: text, $options: 'i' } }
                ]
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $limit: limit
        }
    ]).skip((page - 1) * limit)
    if(!tweets.length){
        throw new apiError({
            status: 400,
            message: "no tweets found"
        })
    }
    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Tweets found successfully",
            data: tweets
        })
    )
})

export {
    createTweet,
    getUserTweet,
    updateTweet,
    deleteTweet,
    getTweetByUsernameOrContent
}