import { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name || !description) {
    throw new ApiError(400, "Playlist name and description is required!!!!!");
  }
  const newPlaylist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  if (!newPlaylist) {
    throw new ApiError(400, "Error while creating the playlist!!!!!!");
  }

  res
    .status(200)
    .json(new ApiResponse(200, newPlaylist, "Playlist created successfully😊"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User ID!!!!!!!!!");
  }
  const userPlaylists = await Playlist.find({
    owner: userId,
  });
  if (!userPlaylists) {
    throw new ApiError(400, "Cann't find user's playlists");
  }
  res
    .status(200)
    .json(
      new ApiResponse(200, userPlaylists, "playlist fetched successfully😊")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Playlist ID is invalid!!!!!!!!!");
  }
  const playLists = await Playlist.findById(playlistId);

  if (!playLists) {
    throw new ApiError(400, "Playlist is not found!!!!!!!!!");
  }
  res
    .status(200)
    .json(new ApiResponse(200, playLists, "Playlists fetched successfully😊"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }
  const newPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      // $push :{videos : videoId} //If the item already exists in the array, it will be added again, resulting in duplicates.
      // $set :{videos : videoId}, //If used on an array field, it will replace the entire array with the new value.
      $addToSet: { videos: videoId }, //Ensures that no duplicates are added to the array. If the item already exists, it will not be added again.
    },
    { new: true }
  );

  if (!newPlaylist) {
    throw new ApiError(400, "Playlist is not found!!");
  }
  res
    .status(200)
    .json(
      new ApiResponse(200, newPlaylist, "Video added into the playlist 😊")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }
  const newPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videos: videoId },
    },
    {
      new: true,
    }
  );
  if (!newPlaylist){
    throw new ApiError(400 ,"Playlist not found or Error while removing the video from the playlist")
  }

  res.status(200).json(new ApiResponse (200,newPlaylist,"Removed video from the playlist 😊"))
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }
  if (!(name || description)){
    // (!name || !description )
    throw new ApiError(400, "Atleast one field is required (name or description)!!!")
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,{
        name,
        description
    },{
        new: true
    }
  )
  if(!updatePlaylist){
    throw new ApiError(400,"Playlist not found or error while updating the playlist")
  }
  res.status(200).json(new ApiResponse(200, updatedPlaylist, "Playlist updated Successfully 😊"))
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    // TODO: delete playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
      }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
    if(!deletedPlaylist){
        throw new ApiError(400,"Playlist not found or error while deleting the playlist")
    }
    res.status(200).json(new ApiResponse(200, deletedPlaylist, "Playlist updated Successfully 😊"))
  });
export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
