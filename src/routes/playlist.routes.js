import { Router } from "express";
import {
    createPlaylist,
    deletePlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    updatePlaylists
} from '../controllers/playlist.controller.js'
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()
router.route('/create-playlist').post(
    verifyJWT,
    createPlaylist
)

router.route("/delete-playlist").get(
    verifyJWT,
    deletePlaylist
)

router.route("/get-user-playlist/:userId").get(
    verifyJWT,
    getUserPlaylists
)

router.route("/get-playlist/:playlistId").get(
    verifyJWT,
    getPlaylistById
)

router.route('/add-video-playlist/:playlistId/:videoId').get(
    verifyJWT,
    addVideoToPlaylist
)

router.route('/remove-video-playlist/:playlistId/:videoId').get(
    verifyJWT,
    removeVideoFromPlaylist
)

router.route('/update-playlist/:playlistId').post(
    verifyJWT,
    updatePlaylists
)

export default router