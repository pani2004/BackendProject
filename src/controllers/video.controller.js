import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { uploadonCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    // const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const { limit = 10, sortType = 'desc' } = req.query;
    const page = req.query.p || 0
    const videosPerPage = limit

    const videos = await Video.find()
        .sort(sortType)
        .skip(page * videosPerPage)
        .limit(videosPerPage)

    return res.status(200).json({
        status: 200,
        videos,
        message: "Videos fetched successfully"
    });
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description,isPublished}   = req.body
    if(!title || !description){
        throw new ApiError(405,"Please provide title and description")
    }
    const videolocalPath = req.files.videoFile[0].path;
    console.log(req.files)
    console.log(videolocalPath)
    if(!videolocalPath){
        throw new ApiError(400,"Video is required")
    }
    let thumbnaillocalPath;
    if(req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length>0){
        thumbnaillocalPath = req.files.thumbnail[0].path
    }
    if(!thumbnaillocalPath){
        throw new ApiError(400,"Thumbnail is required")
    }
    const thumbnail = await uploadonCloudinary(thumbnaillocalPath)
    const video = await uploadonCloudinary(videolocalPath)
    const videoObj = await Video.create({
        videoFile : video.url,
        thumbnail : thumbnail.url,
        title,
        description,
        duration: video.duration,
        isPublished,
        owner:req.user
    }
    )
    return res.status(200).json(new ApiResponse(200,"Video uploaded successfully",videoObj))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400,"Pls provide video id")
    }
    const fetchedVideo = await Video.findByIdAndUpdate(
        {_id:videoId},
        {$inc:{views:1}},
        {new:true}
    )
    if(!fetchedVideo){
        throw new ApiError(400,"Video not found")
    }
    return res.status(200).json(new ApiResponse(200,fetchedVideo,"Video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title,description} = req.body
    if (!videoId) {
        throw new ApiError(400, "Video ID is require")
    }
    if (!(title && description)) {
        throw new ApiError(400, "Title and description is require")
    }
    const thumbnailLocalPath = req.file.path
    //upload cloudnary to cloud
    const thumbnail = await uploadonCloudinary(thumbnailLocalPath);
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is require")
    }
    await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: thumbnail.url
            }
        },
        { new: true }
    )
    return res.status(201).json(
        new ApiResponse(201, "Video details updatd successfully", {})
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
     throw new ApiError(400, "Please provide video ID");
    }
    const deletedVideo = await Video.deleteOne({
        _id:videoId
    })
    if(deletedVideo.deletedCount === 0){
        throw new ApiError(404, "Video not found");
    }
    return res.status(200)
    .json(new ApiResponse(200, {}, "Video Deleted Successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(400, "Video Id is missing");
    }
    // Fetch the current video document
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    // Toggle the isPublished status
    const newVideoStatus = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video.isPublished // Toggle the current status
            }
        },
        { new: true }
    )
    return res.status(200).json({
        status: 200,
        data: newVideoStatus,
        message: "Publish Status Updated Successfully"
    })
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}