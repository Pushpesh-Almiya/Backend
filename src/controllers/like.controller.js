import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;

  // Validate the video ID
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID!!!!!!!");
  }
  // Attempt to find the like document for the video by the user
  const like = await Like.findOne({ video: videoId, likedBy: userId });
  if (like) {
    // If a like exists, remove it
    await like.deleteOne();
    return res
      .status(200)
      .json(new ApiResponse(200, like, "Video unliked successfully 👎🏻"));
  }
  // If no like exists, create a new like document
  const likedVideo = await Like.create({ video: videoId, likedBy: userId });
  // Respond with the liked video details and a success message
  return res
    .status(201)
    .json(new ApiResponse(201, likedVideo, "Video liked successfully 👍🏻"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment ID!!!!!!!!");
  }

  const comment = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (comment) {
    await comment.deleteOne();
    return res
      .status(200)
      .json(new ApiResponse(200, comment, "Comment unliked successfully 👎🏻"));
  }
  const likedComment = await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, likedComment, "Comment liked successfully 👍🏻"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet ID!!!!!!!!");
  }
  const tweet = await Like.findOne({ tweet: tweetId, likedBy: req.user?._id });

  if (tweet) {
    await tweet.deleteOne();
    return res
      .status(200)
      .json(new ApiResponse(200, tweet, "Tweet unliked successfully 👎🏻"));
  }
  const likedTweet = await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, likedTweet, "Tweet liked successfully 👍🏻"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User ID!!!!!!!!");
  }
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
        pipeline: [
          {
            $project: {
              _id: 1,
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              duration: 1,
              views: 1,
              isPublished: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$videoDetails" },
  ]);

  if (!likedVideos) {
    throw new ApiError(400, "Cann't get liked videos!!!!!!");
  }
  if (likedVideos.length === 0) {
    return res.status(200)
        .json(new ApiResponse(200, {}, "You haven't liked any videos yet"))
}
  res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "All liked videos fetched successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
