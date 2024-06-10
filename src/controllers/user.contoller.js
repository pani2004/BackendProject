import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadonCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
const genreateAccessandRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        const accessToken = user.generateAccesstoken();
        const RefereshToken = user.generateRefereshtoken();
        user.RefereshToken = RefereshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, RefereshToken };
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

    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path
    }
    console.log(avatarLocalPath)
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }
    const avatar = await uploadonCloudinary(avatarLocalPath)
    console.log(avatar)
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
    const {email,name,password} = req.body // get the email,username,pw from the body
    console.log(email)
    if(!(name || email)){
        throw new ApiError(400,"Username or password is required")
    }
     const user = await User.findOne({ // find the user in db
        $or:[{name},{email}]
    })
    if(!user){
        throw new ApiError(404,"User does not exist")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(404,"Invalid credentials") // check the pw
    }
    const {accessToken,RefereshToken} = await genreateAccessandRefreshTokens(user._id)
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200).cookie("accestoken",accessToken,options).cookie("refreshtoken",RefereshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,RefereshToken
            },
            "User logged in successfully"
        )
    )
}) 
  const loggedoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200).clearCookie("accessToken",options).clearCookie("RefereshToken",options)
    .json(new ApiResponse(200,{},"User logged out"))
  })
const refreshAccessToken = asyncHandler(async(res,req)=>{
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
        if(incomingRefreshToken!== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
        const options = {
            httpOnly:true,
            secure:true
        }
        const {accessToken,newrefreshToken} = await genreateAccessandRefreshTokens(user._id)
        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",newrefreshToken,options)
        .json(
            new ApiResponse(200,
                {accessToken,refreshToken:newrefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refreshtoken")
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

export {registerUser,
    loginUser,
    loggedoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateCoverImage
} 