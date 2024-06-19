import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on video
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(400, "video id is missing");
    }

    const checkLikedVideo = await Like.find({
        video: videoId,
        likedBy: req.user
    })

    if (checkLikedVideo[0]) {
        await Like.findByIdAndDelete(checkLikedVideo[0]._id)
        return res.status(200)
            .json(
                new ApiResponse(200, {}, "Like removed")
            )
    } else {
        const likedVideo = await Like.create({
            likedBy: req.user,
            video: videoId
        })
        if (!likedVideo) {
            throw new ApiError(500, "Unable to Like")
        }

        return res.status(200)
            .json(
                new ApiResponse(200, likedVideo, "Liked")
            )
    }

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on comment
    const { commentId } = req.params
    if (!commentId) {
        throw new ApiError(400, "Comment id is missing");
    }

    const checkLikedComment = await Like.find({
        comment: commentId,
        likedBy: req.user
    })

    if (checkLikedComment[0]) {
        await Like.findByIdAndDelete(checkLikedComment[0]._id)
        return res.status(200)
            .json(
                new ApiResponse(200, {}, "Like removed")
            )
    } else {
        const likedComment = await Like.create({
            likedBy: req.user,
            comment: commentId
        })
        if (!likedComment) {
            throw new ApiError(500, "Unable to Like")
        }

        return res.status(200)
            .json(
                new ApiResponse(200, likedComment, "Liked")
            )
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on tweet
    const { tweetId } = req.params
    if (!tweetId) {
        throw new ApiError(400, "Tweet id is missing");
    }

    const checkLikedTweet = await Like.find({
        tweet: tweetId,
        likedBy: req.user
    })

    if (checkLikedTweet[0]) {
        await Like.findByIdAndDelete(checkLikedTweet[0]._id)
        return res.status(200)
            .json(
                new ApiResponse(200, {}, "Like removed")
            )
    } else {
        const likedTweet = await Like.create({
            likedBy: req.user,
            tweet: tweetId
        })
        if (!likedTweet) {
            throw new ApiError(500, "Unable to Like")
        }

        return res.status(200)
            .json(
                new ApiResponse(200, likedTweet, "Liked")
            )
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideos = await Like.find({
        likedBy: req.user,
        video: { $exists: true }
    }).populate("video")

    return res.status(200)
        .json(
            new ApiResponse(200, likedVideos, "Liked Videos Fetched")
        )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}