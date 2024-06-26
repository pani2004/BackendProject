import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadonCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
const genreateAccessandRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        const accessToken = user.generateAccesstoken();
        const refreshToken = user.generateRefereshtoken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        console.error('Error in genreateAccessandRefreshTokens:', error);
        throw new ApiError(500, "Something went wrong");
    }
};

const registerUser = asyncHandler(async(req,res)=>{
    //get user details from frontend
    //validation - not empty
    // check if user already exists:username,email
    //check for images,check for avatar
    //upload them to cloudinary,avatar
    //create user object- create entry in db
    //remove pw and refresh token field from response
    // check for user creation
    // return response
     
    const {fullName,email,password,name} = req.body
    
    if(
      [fullName,email,password,name].some((field)=>field?.trim() === "")
    )
    {
       throw new ApiError(400,"All fields are required")
    }
    const existedUser = await User.findOne({
        $or:[{name},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User already exists")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }
    const avatar = await uploadonCloudinary(avatarLocalPath)
    const coverImage = await uploadonCloudinary(coverImageLocalPath)
    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

   const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,password,
        name:name.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
})

const loginUser = asyncHandler(async(req,res)=>{
    //req body ->data
    //username or email
    // find the user
    //verify the pw
    //generate access and refresh token
    //send cookies
    const {email,name,password} = req.body
    if(!email || !name){
        throw new ApiError(400,"All the fields are required")
    }
    const user = await User.findOne({
        $or:[{name},{email}]
    })
    if(!user){
        throw new ApiError(404,"User doesnot exist")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credintials")
    }
    const{accessToken,refreshToken} = await genreateAccessandRefreshTokens(user._id)
    const loggedinUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly:true,
        secure: true
    }
    return res.status(200).cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200,{
        user:loggedinUser,accessToken,refreshToken
    },"User logged in successfully"))
})
 const loggedoutUser = asyncHandler(async(req,res)=>{
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:1
            }
        },
        {
            new:true
        }
    )
    const options = {
        httpOnly:true,
        secure: true
    }
    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out successfully"))
 })
 const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFERESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
        const options={
           httpOnly:true,
           secure:true
        }
        const {accessToken,newRefreshToken} = await genreateAccessandRefreshTokens(user._id)
        return res.status(200).cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},"Access token refreshed successfully"))
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }
 })
 const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const{oldPassword,newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400,"Incorrect Password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave:false})
    return res.status(200).json(new ApiResponse(200,{},"Password changed succesfully"))
})
const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(new ApiResponse(200,{},"User fetched successfully"))
})
const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email} = req.body
    if(!fullName || !email){
        throw new ApiError(401,"All fields are required")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            fullName,
            email
        }
    },{new:true}).select("-password")
     return res.status(200).json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }
    const avatar = await uploadonCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400,"Error while uploading avatar")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            avatar:avatar.url
        }
    },{new:true}).select("-password")
    return res.status(200).json(new ApiResponse(200,user,"Avatar image updated successfully"))
})

const updateCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover image file is missing")
    }
    const coverImage = await uploadonCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading cover image")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            coverImage:coverImage.url
        }
    },{new:true}).select("-password")
    return res.status(200).json(new ApiResponse(200,user,"Cover image updated successfully"))
})
const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {name} = req.params
    if(!name?.trim()){
        throw new ApiError(400,"Username is missing")
    }
    const channel = await User.aggregate([
       {
        $match:{
            name:name?.toLowerCase()
        }
       },
       {
        $lookup:{ // how many subscribers the channel has
            from:"subscriptions",
            localField:"_id",
            foreignField:"channel",
            as:"subscribers"
        }
       },
       {
        $lookup:{ // to how many channels u have subscribed
            from:"subscriptions",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscribedTo"
        }
       },
       {
        $addFields:{
            subscribersCount:{
                $size:"$subscribers"
            },
            channelsSubscribedToCount:{
                $size:"$subscribedTo"
            },
            isSubscribed:{
                $cond:{
                    if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                    then:true,
                    else:false
                }
            }
        }
       },
       {
          $project:{
            fullName:1,
            name:1,
            email:1,
            channelsSubscribedToCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1
          }
       }
    ])
    if(!channel?.length){
        throw new ApiError(400,"Channel doesnot exist")
    }
    return res.status(200)
    .json(new ApiResponse(200,channel[0],"User channel fetched successfully"))
})
const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"Video",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"User",
                            localField:"owner",
                            foreignField:"_is",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        name:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200,user[0].watchHistory,"Watch History Fetched Successfully"))
})
export{registerUser,loginUser,
       loggedoutUser,
       refreshAccessToken,
       changeCurrentPassword,
       getCurrentUser,
       updateAccountDetails,
       updateUserAvatar,
       updateCoverImage,
       getUserChannelProfile,
       getWatchHistory
}
