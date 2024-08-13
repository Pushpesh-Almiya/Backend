import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import uploadOnCloudinary from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = "desc", userId } = req.query;
    
    const sort = {};
    sort[sortBy] = sortType === 'asc' ? 1 : -1;

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: sort
    };

    const match = {};
    if (query) {
        match.$or = [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ];
    }
    if (userId) {
        match.owner = new mongoose.Types.ObjectId(userId);
    }

    // console.log("Match Object:", match);

    const aggregationPipeline = [
        { $match: match },
        { $sort: sort },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        { $unwind: "$ownerDetails" }, 
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                updatedAt: 1,
                owner_id: "$ownerDetails._id",
                username: "$ownerDetails.username",
                email: "$ownerDetails.email",
                avatar : "$ownerDetails.avatar"
                
            }
        }
    ];


    try {
        const result = await Video.aggregatePaginate(
            Video.aggregate(aggregationPipeline),
            options
        );

        res.status(200).json(new ApiResponse(200,result,"get all videos successfully"));
    } catch (error) {
        console.error("Error during aggregation:", error);
        res.status(500).json({ message: 'Failed to fetch videos', error: error.message });
    }
});
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if(!title || !description){
        throw new ApiError(400,"Title and description is required!!")
    }
    const videoFileLocalPath = req.files?.videoFile[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;
    if (!videoFileLocalPath && !thumbnailLocalPath) {
        throw new ApiError(400, "VideoFile and thumbnail is required!!!!!!");
      }
    //   console.log("Video file => ",req.files?.videoFile[0]);
      
    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    
    if (!videoFile && !thumbnail) {
        throw new ApiError(400, "VideoFile and thumbnail is required!!!!!!");
      }
    //   console.log(videoFile);
      
      const video = await Video.create({
        videoFile:videoFile.url,
        thumbnail:thumbnail.url,
        title ,
        description ,
        duration :videoFile.duration,
        views :0,
        isPublished :true,
        owner :req.user._id
      })
      
      res.status(200).json (new ApiResponse(200, video,"Video is Published ▶️"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    //TODO: get video by id
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Video Id is invalid or not empty")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"video not found")
    }
    res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"))
    
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title,description} = req.body;
    //TODO: update video details like title, description, thumbnail
    if (!isValidObjectId(videoId)){
        throw new ApiError(400, "Video Id is invalid or not empty")
    }
    
    if(!(title || description ||thumbnailLocalPath)){
        throw new ApiError(400, "Atleast one filed is required!!!!")
    }

    let thumbnailLocalPath;
    let thumbnail;
    if(req.file){
        thumbnailLocalPath = req.file?.path;
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    }
    // console.log(thumbnail)
    const updatedVideo = await Video.findByIdAndUpdate(videoId,{
        $set:{
            title,
            description,
            thumbnail :thumbnail.url //Handle problem when thumbnail is not provided
        }
    },{
        new:true
    })
    if(!updatedVideo){
        throw new ApiError(400,"video file is not found")
    }
    res.status(200).json(new ApiResponse(200,updatedVideo,"Video details updated successfully 😊"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id")
    }
    //TODO: delete video
    await Video.findByIdAndDelete(videoId)
    res.status(200).json(new ApiResponse(200,{},"Video Deleted successfully😊"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id")
    }
    const video = await Video.findByIdAndUpdate(videoId,{
        $set:{
            isPublished:false
        }
    },{new:true})
    res.status(200).json(new ApiResponse(200,video, "Toggle video status😊"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}