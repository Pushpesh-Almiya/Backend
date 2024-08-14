import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid VideoId!!!!");
  }

  //ParseInt takes two arguments - string & radix =>10base
  const pageNum = parseInt(page, 10);
  const limitation = parseInt(limit, 10);

  if (isNaN(pageNum) || isNaN(limitation) || pageNum < 1 || limitation < 1) {
    throw new ApiError(400, "Invalid page or limit number!!");
  }
  const comments = await Comment.aggregate([
    { $match: { video: new mongoose.Types.ObjectId(videoId) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    { $unwind: "$userDetails" },
    { $skip: (pageNum - 1) * limitation }, // Skips the first <(pageNum - 1) * limitation> documents
    { $limit: limitation }, // Limits the result to <limitation> documents after skipping
    {
      $project:{
        id :1,
        content :1,
        video :1,
        createdAt :1,
        userId :"$userDetails._id",
        userNmaePummy :"$userDetails.userName",
        fullName :"$userDetails.fullName",
        avatar :"$userDetails.avatar"
      }
    }
  ]);
  if (comments.length ===0){
    throw new ApiError(400 ,"No comments in this video")
  }
  res
    .status(200)
    .json(
      new ApiResponse(200, comments, "All comments fetched successfully✅😊")
    );
});

const addComment = asyncHandler(async (req, res) => {
  const { comment } = req.body;
  const { videoId } = req.params;
  const userId = req.user?._id;

  console.log(isValidObjectId(videoId));

  if (!comment || comment.trim() === "") {
    throw new ApiError(400, "Comment is required!!!!");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video Id is not valid!!!!!!");
  }
  const newComment = await Comment.create({
    video: videoId,
    content: comment,
    owner: userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newComment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { comment } = req.body;
  const { commentId } = req.params;
  if (!comment || comment.trim() === "") {
    throw new ApiError(400, "Comment is required!!!!!!!");
  }
  if (!commentId || commentId.trim() === "") {
    throw new ApiError(400, "Comment ID is invalid!!!!");
  }
  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: { content: comment },
    },
    { new: true }
  );

  res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment Updated Successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.body;
  if (!commentId || commentId.trim() === "") {
    throw new ApiError(400, "Comment id is not found");
  }
  //   if (!mongoose.isValidObjectId(commentId)) {
  //     throw new ApiError(400, "Comment ID is not valid");
  // }
  const deletedComment = await Comment.findOneAndDelete(commentId);

  res.status(200).json(200, deletedComment, "Comment deleted😊");
});

export { getVideoComments, addComment, updateComment, deleteComment };
