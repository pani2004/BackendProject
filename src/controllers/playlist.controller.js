import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist
    const { name, description } = req.body
    if (!name || !description) {
        throw new ApiError(400, "All Fields are require")
    }

    const createdPlaylist = await Playlist.create({
        name,
        description,
        owner: req.user
    })

    return res.status(200)
        .json(new ApiResponse(200, createdPlaylist,
            "Playlist created successfully")
        )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User Id")
    }

    const userPlaylist = await Playlist.find({ owner: userId })
        .populate("owner", "name email")

    return res.status(200)
        .json(new ApiResponse(200, userPlaylist,
            "Playlist(s) Fetched")
        )

})

const getPlaylistById = asyncHandler(async (req, res) => {
    //TODO: get playlist by id
    const { playlistId } = req.params
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist Id")
    }

    const fetchedPlaylist = await Playlist.findById({ _id: playlistId })

    return res.status(200)
        .json(new ApiResponse(200, fetchedPlaylist,
            "Playlist Fetched")
        )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!playlistId || !videoId) {
        throw new ApiError(400, "Playlist and Video ID required");
    }

    try {
        // Find the playlist by ID
        const playlist = await Playlist.findById(playlistId);

        // Check if the playlist exists
        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        // Check if the videoId already exists in the playlist
        if (playlist.video?.includes(videoId)) {
            return res.status(200).json(new ApiResponse(200, playlist, "Video already exists in playlist"));
        }

        // Add the videoId to the video array
        playlist.video.push(videoId);
        await playlist.save();

        // Respond with the updated playlist
        return res.status(200).json(new ApiResponse(200, playlist, "Video added to playlist"));
    } catch (error) {
        // Handle any potential errors
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json(new ApiResponse(error.statusCode, null, error.message));
        } else {
            console.error(error);
            return res.status(500).json(new ApiResponse(500, null, "Check video or playlist ID"));
        }
    }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!playlistId || !videoId) {
        throw new ApiError(400, "Playlist and Video ID required");
    }

    try {
        // Find the playlist by ID
        const playlist = await Playlist.findById(playlistId);

        // Check if the playlist exists
        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        // Check if the videoId exists in the playlist
        const videoIndex = playlist.video.indexOf(videoId);
        if (videoIndex === -1) {
            return res.status(404).json(new ApiResponse(404, null, "Video not found in playlist"));
        }

        // Remove the videoId from the video array
        playlist.video.splice(videoIndex, 1);
        await playlist.save();

        // Respond with the updated playlist
        return res.status(200).json(new ApiResponse(200, playlist, "Video removed from playlist"));
    } catch (error) {
        // Handle any potential errors
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json(new ApiResponse(error.statusCode, null, error.message));
        } else {
            console.error(error);
            return res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
        }
    }
});


const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    if (!playlistId) {
        throw new ApiError(400, "Playlist ID required");
    }

    try {
        // Find and delete the playlist by ID
        const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

        // Check if the playlist was found and deleted
        if (!deletedPlaylist) {
            throw new ApiError(404, "Playlist not found");
        }

        // Respond with a success message
        return res.status(200).json(new ApiResponse(200, null, "Playlist deleted successfully"));
    } catch (error) {
        // Handle any potential errors
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json(new ApiResponse(error.statusCode, null, error.message));
        } else {
            console.error(error);
            return res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
        }
    }
});


const updatePlaylist = asyncHandler(async (req, res) => {
    //TODO: update playlist

    const { playlistId } = req.params
    const { name, description } = req.body

    if (!name || !description) {
        throw new ApiError(405, "name and description both are require");
    }
    if (!playlistId) {
        throw new ApiError(405, "playlist id is missing");
    }

    const updatedPlaylist = await Playlist.findOneAndUpdate(
        { _id: playlistId },
        {
            $set: {
                name,
                description
            }
        },
        { new: true }
    )
    return res.status(200)
        .json(new ApiResponse(200, updatedPlaylist, "Playlist details updated"));
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}