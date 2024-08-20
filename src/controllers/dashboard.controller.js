import mongoose, { isValidObjectId } from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user?._id;
    if (!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid userId!!!!!!!")
    }
    const channelStats = await Video.aggregate([
        {$match :{
            owner : userId
        }},
        // Lookup for Subscribers of a channel
        {$lookup :{
            from :"subscriptions",
            localField :"owner",
            foreignField :"channel",
            as : "subscribers"
        }},
        // Lookup for the channel which the owner Subscribe
        {$lookup:{
            from :'subscriptions',
            localField :"owner",
            foreignField :"subscriber",
            as :"subscribedTo"
        }},
        // Lookup for likes in the user's videos
        {
            $lookup :{
                from :"likes",
                localField :"_id",
                foreignField :"video",
                as :"likedVideos"
            }
        },
        // Lookup for comments in the user's videos
        {
            $lookup :{
                from :"comments",
                localField :"_id",
                foreignField :"video",
                as :"videoComments"
            }
        },
        // Lookup for tweets by the user
        {
            $lookup :{
                from :"tweets",
                localField :"owner",
                foreignField :"owner",
                as :"userTweets"
            }
        },
        // Group to calculate stats
        {
            $group: {
              _id: null,
              totalVideos: { $sum: 1 },
              totalViews: { $sum: "$views" },
              subscribers: { $first: "$subscribers" },
              subscribedTo: { $first: "$subscribedTo" },
              totalLikes: { $sum:  {$size: "$likedVideos"} },
              totalComments: { $sum: { $size: "$videoComments" } },
              totalTweets: { $first: { $size: "$userTweets" } },
            },
        },

        {
            $project :{
                
                    _id: 0,
                    totalVideos: 1,
                    totalViews: 1,
                    subscribers: {$size :"$subscribers"},
                    subscribedTo: {$size :"$subscribedTo"},
                    totalLikes: 1,
                    totalComments: 1,
                    totalTweets: 1
                
            }
        }

    ])

    return res.status(200).json(new ApiResponse(200,channelStats[0], "Channel stats fetched successfully ✅"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user?._id;
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid UserID !!!!!!!!!!")
    }
    const videos = await Video.find({owner :userId})
    if (!videos[0]) {
        return res.status(200)
            .json(new ApiResponse(404, [], "No videos found"))
    }
    return res.status(200).json(new ApiResponse(200,videos,"All channel videos fetched successfully✅"))
})

export {
    getChannelStats, 
    getChannelVideos
    }