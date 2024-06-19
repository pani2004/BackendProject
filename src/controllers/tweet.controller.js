import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { tweet } = req.body
    if (!tweet) {
        throw new ApiError(400, "Please provide tweet");
    }

    const savedTweet = await Tweet.create({
        content: tweet,
        owner: req.user
    })

    return res.status(201).json(
        new ApiResponse(201, "Tweet added successfully", savedTweet)
    );
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
        return res.status(404).json(new ApiResponse(404, {}, 'Invalid tweet ID'));
    }

    const fetchedTweet = await Tweet.find({ owner: userId })
    if (fetchedTweet.length === 0) {
        return res.status(404).json(new ApiResponse(404, {}, 'Zero Tweet'));
    }

    return res.status(200).json(new ApiResponse(200, fetchedTweet, "Tweet(s) Fetched Successfully"));

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { tweet } = req.body
    if (!tweetId || !tweet) {
        throw new ApiError(405, "tweetId and tweet both are require");
    }

    const updatedTweet = await Tweet.findOneAndUpdate(
        { _id: tweetId },
        {
            $set: {
                content: tweet,
                update: true
            }
        },
        { new: true }
    )
    return res.status(200)
        .json(new ApiResponse(200, updatedTweet, "Comment Updated Successfully"));
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;
    if (!tweetId) {
        throw new ApiError(400, "Please provide Tweet ID");
    }

    const deletedTweet = await Tweet.deleteOne({ _id: tweetId })
    if (deleteTweet.deletedCount === 0) {
        return res.status(300).json(new ApiResponse(300, {}, "Tweet Not Found"));
    }

    return res.status(200).json(new ApiResponse(200, {}, "Tweet Deleted Successfully"));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}