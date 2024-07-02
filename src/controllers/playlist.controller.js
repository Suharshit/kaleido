import { asyncHandler } from "../utils/asyncHandler.js";
import { Playlist } from "../modals/playlist.modal.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Video } from "../modals/video.modal.js"

// createPlaylist
const createPlaylist = asyncHandler(async(req, res) => {
    const { name, description } = req.body;
    const playlist = await Playlist.create({
        name: name, 
        description: description,
        owner: req.user,
        videos: []
    });
    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Playlist created successfully",
            data: playlist
        })
    )
})

// getUserPlaylists
const getUserPlaylists = asyncHandler(async(req, res) => {
    const userId = req.user?._id;
    const playlists = await Playlist.find({
        owner: userId 
    }).populate({
        path: "owner",
        select: "username avatar email fullname"
    });
    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Playlists fetched successfully",
            data: playlists
        })
    )
})

// getPlaylistById
const getPlaylistById = asyncHandler(async(req, res) => {
    const { playlistId } = req.params
    const playlist = await Playlist.findById(playlistId).populate({
        path: "owner",
        select: "username avatar email fullname"
    });
    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Playlist fetched successfully",
            data: playlist
        })
    )
})

// addVideoToPlaylist
const addVideoToPlaylist = asyncHandler(async(req, res) => {
    const { playlistId, videoId } = req.params;
    if(!playlistId || !videoId){
        throw new apiError({
            status: 400,
            message: "Invalid request parameters"
        })
    }
    const beforeplaylist = await Playlist.findById(playlistId);
    const beforevideo = await Video.findById(videoId);
    if(!beforeplaylist || !beforevideo){
        throw new apiError({
            status: 404,
            message: "Playlist or video not found"
        })
    }
    if(beforeplaylist.owner.toString() !== req.user._id.toString()){
        throw new apiError({
            status: 403,
            message: "You are not authorized to perform this action"
        })
    }
    const videoExists = await Playlist.find({
        videos: {
            $in: [videoId]
        }
    })
    if(videoExists.length > 0){
        throw new apiError({
            status: 400,
            message: "Video already exists in playlist"
        })
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
           $push: { videos: videoId }
        },
        {
            new: true
        }
    )
    if(!playlist){
        throw new apiError({
            status: 404,
            message: "video not push"
        })
    }

    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Video added to playlist successfully",
            data: playlist
        })
    )
})

// removeVideoFromPlaylist
const removeVideoFromPlaylist = asyncHandler(async(req, res) => {
    const { playlistId, videoId } = req.params;
    if(!playlistId || !videoId){
        throw new apiError({
            status: 400,
            message: "Please provide playlistId and videoId"
        })
    }
    const beforePlaylist = await Playlist.findById(playlistId)
    const beforeVideo = await Video.findById(videoId)
    if(!beforePlaylist || !beforeVideo){
        throw new apiError({
            status: 404,
            message: "Playlist or video not found"
        })
    }
    if(beforePlaylist.owner.toString() !== req.user._id.toString()){
        throw new apiError({
            status: 403,
            message: "You are not authorized to perform this action"
        })
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { videos: videoId }
        },
        {
            new: true
        }
    )

    if(!playlist){
        throw new apiError({
            status: 404,
            message: "Video not removed in playlist"
        })
    }

    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Video removed from playlist successfully",
            data: playlist
        })
    )
})

// deletePlaylist
const deletePlaylist = asyncHandler(async(req, res) => {
    const { playlistId } = req.params;
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new apiError({
            status: 404,
            message: "Playlist not found"
        })
    }
    await Playlist.findByIdAndDelete(playlistId)
    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Playlist deleted successfully",
        })
    )
})

// updatePlaylists
const updatePlaylists = asyncHandler(async(req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name: name,
                description: description
            }
        },
        {
            new: true
        }
    )
    if(!playlist){
        throw new apiError({
            status: 404,
            message: "Playlist not found"
        })
    }
    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Playlist updated successfully",
            data: playlist
        })
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylists
}