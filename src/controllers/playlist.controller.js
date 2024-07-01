import { asyncHandler } from "../utils/asyncHandler";
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
    const { userId } = req.params;
    const playlists = await Playlist.find({
        owner: userId 
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
    const playlist = await Playlist.findById(playlistId);
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
    if(!(playlistId && videoId)){
        throw new apiError({
            status: 400,
            message: "Invalid request parameters"
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