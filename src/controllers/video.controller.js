import mongoose, { isValidObjectId } from "mongoose";
import { apiError } from '../utils/apiError.js'
import { apiResponse } from '../utils/apiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { uploadOnCloudInary, deleteFromCloudInary } from "../utils/cloudinary.js";
import { Video } from '../modals/video.modal.js'

const publishVideo = asyncHandler(async(req, res) => {
    const {title, description } = req.body
    const user = req.user
    if(!(title && description)){
        throw new apiError({
            status: 400,
            message: "Please provide title and description"
        })
    }
    
    const videoLocalPath = req.files?.video[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if(!(videoLocalPath && thumbnailLocalPath)){
        throw new apiError({
            status: 400,
            message: "Please provide video and thumbnail"
        })
    }

    const video = await uploadOnCloudInary(videoLocalPath)
    const thumbnail = await uploadOnCloudInary(thumbnailLocalPath)

    if(!(video && thumbnail)){
        throw new apiError({
            status: 500,
            message: "Error while uploading video on cloudinary"
        })
    }

    const publishVideo = await Video.create({
        title,
        description,
        owner: user,
        videoFile: video.url,
        thumbnail: thumbnail.url,
        duration: video.duration
    })

    const uploadedvideo = await Video.findById(publishVideo._id)

    if(!uploadedvideo){
        throw new apiError({
            status: 500,
            message: "Error while fetching video"
        })
    }

    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Video published successfully",
            data: uploadedvideo
        })
    )
})

// getAllvideos
const getAllVideos = asyncHandler(async(req, res) => {
    const { page = 1, limit = 10, query = ' '} = req.query
    const videos = await Video.aggregate([
        {
            $match: {
                $or: [
                    {title: {$regex: query, $options: 'i'}},
                ]
            }
        },
        {
            $limit: limit
        },
        {
            $sort: {
                views: 1
            }
        }
    ]).skip((page - 1) * limit)
    if(!videos){
        throw new apiError({
            status: 500,
            message: "Error while fetching videos"
        })
    }
    if(videos.length === 0){
        throw new apiError({
            status: 404,
            message: "No videos found"
        })
    }
    
    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Videos fetched successfully",
            data: videos
        })
    )
})

// getVideoById
const getVideoById = asyncHandler(async(req, res) => {
    const { videoId } = req.params
    console.log(videoId);
    const video = await Video.findById(videoId).populate("owner", "username email")
    if(!video){
        throw new apiError({
            status: 500,
            message: "Error while fetching video"
        })
    }
    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Video fetched successfully",
            data: video
        })
    )
})

// UpdateVideoInformation
const updateVideoInformation = asyncHandler(async(req, res) => {
    const { title, description} = req.body
    const { videoId } = req.params

    if(!videoId){
        throw new apiError({
            status: 400,
            message: "Video id is required"
        })
    }

    if(!(title && description)){
        throw new apiError({
            status: 400,
            message: "Please provide title and description"
        })
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description
            }
        },
        { new: true }
    )

    if(!updatedVideo){
        throw new apiError({
            status: 500,
            message: "Error while updating video"
        })
    }

    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Video updated successfully",
            data: updatedVideo
        })
    )
})

// deleteVideo
const deleteVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new apiError({
            status: 400,
            message: "Video id is required"
        })
    }
    const video = await Video.findById(videoId)
    console.log(video);
    const deletevideo = await deleteFromCloudInary(video.videoFile)
    const deletethumbnail = await deleteFromCloudInary(video.thumbnail)

    if(!(deletevideo && deletethumbnail)){
        throw new apiError({
            status: 500,
            message: "Error while deleting video"
        })
    }

    await Video.findByIdAndDelete(videoId)

    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Video deleted successfully",
            data: {}
        })
    )
})

// togglePublishStatus
const togglePublishStatus = asyncHandler(async(req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new apiError({
            status: 400,
            message: "Video id is required"
        })
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new apiError({
            status: 404,
            message: "Video not found"
        })
    }
    video.isPublished = !video.isPublished
    await video.save({
        validateBeforeSave: false
    })
    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Video published status updated successfully",
            data: video
        })
    )
})

export {
    publishVideo,
    getAllVideos,
    getVideoById,
    updateVideoInformation,
    deleteVideo,
    togglePublishStatus
}