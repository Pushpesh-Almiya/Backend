import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import User from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content}= req.body;
    const userId = req.user._id
    if (!content){
        throw new ApiError(400,"Content is required!!!!!!!!!")
    }
    if (!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid user ID!!!!!!!!!")
    }
    const tweet = await Tweet.create({
        content,
        owner : userId
    })
    if (!tweet){
        throw new ApiError(400,"Error while tweet!!!!!!!")
    }
    res.status(200).json(new ApiResponse(200,tweet,"Tweet successfull ✅😊"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params;
    
    if (!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid user ID!!!!!!!!!")
    }
    const userTweets = await Tweet.aggregate([
        {$match: {
            owner : new mongoose.Types.ObjectId(userId)
        }},
        {$lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"userDetails",
            pipeline:[
                {$project:{
                    userName :1,
                    fullName :1,
                    avatar:1
                }}
            ]
        }},
        {$unwind :"$userDetails"}
    ])

    res.status(200).json(new ApiResponse(200,userTweets,"Tweets fetched successfull ✅😊"))
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    const {content} = req.body
    if (!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweet ID!!!!!!!!!")
    }
    if(!content){
        throw new ApiError(400,"Content is required!!!!!!!!!")
    }
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,{
            $set :{content}
        },{
            new :true
        }
    )
    if(!updatedTweet){
        throw new ApiError(400,"Tweet is not found or error while updating the tweet!!!!!!!!!")
    }

    res.status(200).json(new ApiResponse(200,updatedTweet,"Tweet updated successfully ✅😊"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    if (!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweet ID!!!!!!!!!")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)
    if(!deletedTweet){
        throw new ApiError(400,"Tweet is not find or error while deleting the tweet!!!!!!!!!")
    }

    res.status(200).json(new ApiResponse(200,deletedTweet,"Tweet deleted successfully ✅😊"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}