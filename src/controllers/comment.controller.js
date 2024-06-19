import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    // TODO: get all comments for a video
    const { videoId } = req.params;
    const { limit = 20, sortType = 'asc' } = req.query;
    const page = parseInt(req.query.p) || 0; // Ensure `page` is an integer
    const sortDirection = sortType === 'asc' ? 1 : -1; // Ensure sorting direction is correct

    try {
        const fetchedComments = await Comment.find({ video: videoId })
            .sort({ createdAt: sortDirection }) // Sorting by createdAt in the specified order
            .skip(page * limit)
            .limit(parseInt(limit)); // Ensure `limit` is an integer

        if (fetchedComments.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "No comments found for the given video",
            });
        }

        return res.status(200).json({
            status: 200,
            comments: fetchedComments,
            message: "Comments fetched successfully",
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "An error occurred while fetching comments",
            error: error.message,
        });
    }
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { comment } = req.body;
    const { videoId } = req.params; // Corrected line
    if (!comment || !videoId) {
        throw new ApiError(405, "Please provide comment and videoId");
    }

    const newComment = await Comment.create({
        content: comment,
        video: videoId,
        owner: req.user
    });

    return res.status(201).json(
        new ApiResponse(201, "Comment Added successfully", newComment) // Changed videoObj to newComment
    );
});

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { comment } = req.body;
    const { commentId } = req.params;
    if (!comment || !commentId) {
        throw new ApiError(405, "Please provide Comment and comment ID");
    }

    const updatedComment = await Comment.findOneAndUpdate(
        { _id: commentId },
        {
            $set: {
                content: comment,
                update: true
            }
        },
        { new: true }
    );

    return res.status(200)
        .json(new ApiResponse(200, updatedComment, "Comment Updated Successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    if (!commentId) {
        throw new ApiError(400, "Please provide Comment ID");
    }

    const deletedComment = await Comment.deleteOne({ _id: commentId })
    if (deletedComment.deletedCount === 0) {
        throw new ApiError(404, "Comment not found");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Comment Deleted Successfully"));
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}