import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel ID!!!!!!!!!!");
  }
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User ID!!!!!!!!!!");
  }

  const subscribeChannel = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });
  if (subscribeChannel) {
    await subscribeChannel.deleteOne();
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Unsubscribe channel successfully"));
  }
  const createSubscription = await Subscription.create({
    subscriber: userId,
    channel: channelId,
  });
  return res
    .status(200)
    .json(new ApiResponse(201, createSubscription, "Subscribe channel"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel ID!!!!!!!!!!");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscribers",
        pipeline: [
          {
            $project: {
              _id: 1,
              userName: 1,
              email: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$subscribers",
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, subscribers, "Fetched Channel Subscribers ✅"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid Subscriber ID!!!!!!!!!!");
  }

  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channels",
        pipeline: [
          {
            $project: {
              _id: 1,
              userName: 1,
              email: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$channels",
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, channels, "Fetched Subscribed channels ✅"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
