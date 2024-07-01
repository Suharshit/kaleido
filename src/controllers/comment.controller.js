import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Comment } from "../modals/comment.modal.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// add a comment to video
const addComment = asyncHandler(async(req, res) => {
    const { videoId } = req.params
    const { content } = req.body
    if(!(videoId && content)){
        throw new apiError({
            status: 400,
            message: "Please provide videoId and content"
        })
    }
    const comment = await Comment.create({
        content: content,
        video: videoId,
        owner: req.user._id
    })
    if(!comment){
        throw new apiError({
            status: 500,
            message: "Error while adding comment"
        })
    }
    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Comment added successfully",
            data: comment
        })
    )
})

// update comment
const updateComment = asyncHandler(async(req, res) => {
    const { commentId } = req.params
    const { content } = req.body
    if(!(commentId && content)){
        throw new apiError({
            status: 400,
            message: "Please provide commentId and content"
        })
    }
    const comment = await Comment.findOneAndUpdate(
        {
            _id: commentId,
        },
        {
            $set: {
                content: content
            }
        },
        {
            new: true
        }
    )
    if(!comment){
        throw new apiError({
            status: 500,
            message: "Error while updating comment"
        })
    }
    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Comment updated successfully",
            data: comment
        })
    )
})

// delete comment
const deleteComment = asyncHandler(async(req, res) => {
    const { commentId } = req.params
    const removedComment = await Comment.findByIdAndDelete(commentId)
    if(!removedComment){
        throw new apiError({
            status: 500,
            message: "Error while removing comment"
        })
    }
    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Comment removed successfully",
            data: {}
        })
    )
})

// get all comments of a video
const getComments = asyncHandler(async(req, res) => {
    const { videoId } = req.params
    const comments = await Comment.find(
        { video: videoId }
    ).sort(
        { createdAt: 1 }
    ).populate({
        path: "owner",
        select: "username avatar"
    })
    if(!comments){
        throw new apiError({
            status: 500,
            message: "Error while fetching comments"
        })
    }
    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Comments fetched successfully",
            data: comments
        })
    )
})

export {
    addComment,
    updateComment,
    deleteComment,
    getComments
}