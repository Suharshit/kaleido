import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { Like } from "../modals/like.modal.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// toggleVideoLike
const toggleVideoLike = asyncHandler(async(req, res) => {
    const { videoId } = req.params
    const userId = req.user._id
    const isLiked = await Like.findOne({
        $and: [
            { video: videoId },
            { likedBy: userId }
        ]
    })
    if (!isLiked) {
        const like = await Like.create({
            video: videoId, 
            likedBy: req.user._id 
        })
        if(!like){
            throw new apiError({
                status: 400,
                message: "video not liked",
                data: like
            })
        }
        return res.status(200)
        .json(
            new apiResponse({
                status: 200,
                message: "video liked successfully",
                data: like
            })
        )
    }
    const likeRemoved = await Like.findOneAndDelete({
        $and: [
            { video: videoId },
            { likedBy: userId }
        ]
    })
    if(!likeRemoved){
        throw new apiError({
            status: 400,
            message: "video not unliked"
        })
    }
    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "video unliked successfully",
            data: likeRemoved
        })
    )
})

// toggleCommentLike
const toggleCommentLike = asyncHandler(async(req, res) => {
    const { commentId } = req.params
    const userId = req.user._id
    const isLiked = await Like.findOne({
        $and: [
            { comment: commentId },
            { likedBy: userId }
        ]
    })
    if (!isLiked) {
        const like = await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })
        if (!like) {
            throw new apiError({
                status: 400,
                message: "comment not liked"
            })
        }
        return res.status(200)
        .json(
            new apiResponse({
                status: 200,
                message: "comment liked successfully",
                data: like
            })
        )
    }
    const likeRemoved = await Like.findOneAndDelete({
        $and: [
            { comment: commentId },
            { likedBy: userId }
        ]
    })
    if (!likeRemoved) {
        throw new apiError({
            status: 400,
            message: "comment not unliked"
        })
    }
    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "comment unliked successfully"
        })
    )
})

// toggleTweetLike
const toggleTweetLike = asyncHandler(async(req, res) => {
    const { tweetId } = req.params
    const userId = req.user._id
    const isLiked = await Like.findOne({
        $and: [
            { tweet: tweetId },
            { likedBy: userId }
        ]
    })
    if (!isLiked) {
        const like = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        })
        if(!like){
            throw new apiError({
                status: 400,
                message: "like not created"
            })
        }
        return res.status(200)
        .json(
            new apiResponse({
                status: 200,
                message: "like created successfully",
                data: like
            })
        )
    }
    const likeRemoved = await Like.findOneAndDelete({
        $and: [
            { tweet: tweetId },
            { likedBy: userId }
        ]
    })
    if(!likeRemoved){
        throw new apiError({
            status: 400,
            message: "like not removed"
        })
    }
    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "like removed successfully",
        })
    )
})

// getLikedVideos
const getLikedVideos = asyncHandler(async(req, res) => {
    const userId = req.user._id
    const likes = await Like.find({ likedBy: userId, video: { $exists : true } })
    if(!likes){
        throw new apiError({
            status: 400,
            message: "no likes found"
        })
    }
    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "likes found successfully",
            data: likes
        })
    )
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}