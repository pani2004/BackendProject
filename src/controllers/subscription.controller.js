import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    // TODO: toggle subscription
    const { channelId } = req.params
    const { userId } = req.user
    if (!channelId) {
        throw new ApiError(400, "Channel ID is missing")
    }

    const checkUser = await Subscription.find({
        $and: [{ channel: channelId }, { subscriber: userId }]
    })

    // if channel/user available, delete it (unsubscribe) 
    if (checkUser[0]) {
        await Subscription.findByIdAndDelete(checkUser[0]._id)
        return res.status(200)
            .json(
                new ApiResponse(200, {}, "Unsubscribed")
            )
    }
    // else create it (subscribe) 
    else {
        const subscribed = await Subscription.create({
            subscriber: req.user,
            channel: channelId
        })
        if (!subscribed) {
            throw new ApiError(500, "subscription failed")
        }
        
        return res.status(200)
            .json(
                new ApiResponse(200, subscribed, "Subscribed")
            )
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    // checking the number of subscribers of a channel  
    const { subscriberId } = req.params
    if (!subscriberId) {
        throw new ApiError(400, "Invalid Channel ID")
    }

    const subscribers = await Subscription.find({ channel: subscriberId }).select("-subscriber -channel")
    return res.status(201).json(
        new ApiResponse(200, subscribers.length, "Subscribers fetched Successfully")
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    // checking the number of subscribed channels  
    const { channelId } = req.params
    if (!channelId) {
        throw new ApiError(400, "Channel id is require")
    }

    const channels = await Subscription.find({ subscriber: channelId })
    const channelsObj = {
        numOfChannels: channels.length,
        channels
    }
    return res.status(201).json(
        new ApiResponse(200, channelsObj, "Channels fetched Successfully")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}