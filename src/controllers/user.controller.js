import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { isValidObjectId } from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};
const registerUser = asyncHandler(async (req, res) => {
  /*
    get user details from frontend
    Validation - not empty
    check if user already exists : email , username
    check for images / avatar
    upload them to cloudinary, avatar
    create user object - create entry in DB
    remove password and refresh token from response
    check for user creation
    return res
    */
  const { userName, email, fullName, password } = req.body;
  if (
    [userName, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All credentials are required");
  }

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (existedUser) {
    throw new ApiError(
      409,
      "User is already exists with this username or email"
    );
  }

  // console.log("Request file form multer ", req.files);

  const avatarLocalPath = req.files?.avatar[0].path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  //check the coverImageLocalPath is exists or not
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required!!!!!!");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required!!!!!!");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // userData from frontend
  // check the user is already exists
  // check the password
  // generate access token and refresh token
  // send cookie

  const { userName, email, password } = req.body;

  if (!(userName || email)) {
    throw new ApiError(400, "username or email is required!!!!!!");
  }
  //Find the user
  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User doesn't exists");
  }
  //Check the password is valid or not
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  //generate access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); //Optional step

  //send cookie
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User LoggedIn Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, //This removes the field from document
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User loggedOut successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incommingRefreshToken =
    req.cookies.refreshToken || req.body?.refreshAccessToken;
  if (!incommingRefreshToken) {
    throw new ApiError(401, "Unathorized Request");
  }

  try {
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    console.log("Decoded token from refreshtoken endpoint ", decodedToken);

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh Token");
    }

    if (incommingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshAccessToken: newRefreshToken,
          },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password change successfully!!!!!!!!"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Current user fatched successfully"));
});

const getUserById = asyncHandler(async(req,res)=>{
  const { userId } = req.params;

  //TODO: get video by id
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "User Id is invalid or not empty");
  }
  const userDetails = await User.findById(userId).select("-password");
  
  if (!userDetails) {
    throw new ApiError(400, "User not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, userDetails, "User fetched successfully"));
})

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { email, userName, fullName } = req.body;
  if (!(email || userName || fullName)) {
    throw new ApiError(400, "All fields are required!!!!!!!!");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { email, userName, fullName },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully!"));
});

const updateUserAvatar = asyncHandler (async (req,res)=>{
  const avatarLoacalPath = req.file?.path
  if (!avatarLoacalPath){
    throw new ApiError(401,"Avarat file is required!!!!!!!")
  }
  const avatar = await uploadOnCloudinary(avatarLoacalPath)
  if (!avatar){
    throw new ApiError(400,"Error while uploading the avatar file")
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar:avatar.url
      }
    },{
      new:true
    }
  ).select("-password")
  return res.status(200)
  .json(new ApiResponse(200,user, "Avatar file updated successfully"))
})

const updateUserCoverImage = asyncHandler (async (req,res)=>{
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath){
    throw new ApiError (400,"Cover image is missing!!!!!!!")
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  if (!coverImage){
    throw new ApiError(400,"Error while uploading the cover image!!!11")
  }
  const user = await User.findByIdAndUpdate(req.user?._id,{
    $set :{
      coverImage :coverImage.url
    }
  },{
    new:true
  }).select("-password")
  return res.status(200)
  .json(new ApiResponse(200,user, "Cover image file updated successfully"))
})

const getUserChannelProfile = asyncHandler (async (req,res)=>{
  const {userName}= req.params;
  if(!userName?.trim()){
    throw new ApiError(400,"username is missing!!!!!!")
  }
  //Aggregation pipeline>>>>>>>>>>
  const channel = await User.aggregate([
    {
      $match :{
        userName : userName?.toLowerCase()
      }
    },
    {
      $lookup:{
        from :"subscriptions",
        localField :"_id",
        foreignField :"channel",
        as:"subscribers"
      }
    },
    {
      $lookup:{
        from :"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as :"subscribedTo"
      }
    },
    {
      $addFields:{
        subscriberCount :{
          $size :"$subscribers"
        },
        channwlSubscribedToCount:{
          $size :"$subscribedTo"
        },
        isSubscribed :{
          $cond:{
            if : {$in:[req.user?._id,"$subscribers.subscriber"]},
            then : true,
            else: false
          }
        }
      }
    },
    {
      $project:{
        fullName :1,
        userName :1,
        subscriberCount:1,
        channwlSubscribedToCount:1,
        isSubscribed:1,
        avatar :1,
        coverImage :1
      }
    }
  ])

  if(!channel?.length){
    throw new ApiError(400,"Channel doesn't exists!!!")
  }
  // console.log("channel ", channel);
  return res.status(200).json(new ApiResponse(200,channel[0],"User channel fatched successfully!!!!!!"))
  
})

const getWatchHistory = asyncHandler (async (req,res)=>{
  const user = await User.aggregate([
    {
      $match :{
        _id :new mongoose.Types.ObjectId(req.user._id)
      }
    },{
      $lookup :{
        from : "videos",
        localField:"watchHistory",
        foreignField:"_id",
        as :"watchHistory",
        pipeline :[
          {
            $lookup :{
              from :"users",
              localField :"owner",
              foreignField :"_id",
              as:"owner",
              pipeline :[
                {
                  $project :{
                    fullName :1,
                    userName :1,
                    avatar :1
                  }
                }
              ]
            }
          },
          {
            $addFields :{
              owner :{
                $first :"$owner"
              }
            }
          }
        ]
      }
    }
  ])

  // console.log(user)
  return res.status(200).json(
    new ApiResponse(200,user[0].watchHistory,'Watch history fetched successfully')
  )
})

export {
  registerUser,
  loginUser,
  logoutUser,
  getUserById,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
