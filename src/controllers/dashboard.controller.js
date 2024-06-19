import mongoose from "mongoose"
import { Like } from "../models/like.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelId = req.user._id;
    if (!channelId) {
        throw new ApiError(400, "Channel ID required");
    }

    try {
        // Fetch all videos for the channel
        const videos = await Video.find({ owner: channelId });

        // Calculate total views and individual video views
        const totalViews = videos.reduce((sum, video) => sum + video.views, 0);
        const videoViews = videos.map(video => ({ videoId: video._id, title: video.title, views: video.views }));

        // Count total videos
        const totalVideos = videos.length;

        // Count total subscribers
        const totalSubscribers = await Subscription.countDocuments({ channel: channelId });

        // Count total likes for all videos in the channel
        const videoIds = videos.map(video => video._id);
        const totalLikes = await Like.countDocuments({ video: { $in: videoIds } });

        // Create response object
        const stats = {
            totalViews,
            totalSubscribers,
            totalVideos,
            totalLikes,
            videoViews
        };

        // Respond with the stats
        return res.status(200).json(new ApiResponse(200, stats, "Channel stats fetched successfully"));
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

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const allVideos = await Video.find({
        owner: req.user
    })

    return res.status(200)
        .json(
            new ApiResponse(200, allVideos, "Videos Fetched")
        )
})

export {
    getChannelStats,
    getChannelVideos
}