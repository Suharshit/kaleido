import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../modals/user.modal.js'
import { uploadOnCloudInary } from '../utils/cloudinary.js'
import { apiError } from '../utils/apiError.js'
import { apiResponse } from '../utils/apiResponse.js'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshtoken = refreshToken
        await user.save({
            validateBeforeSave: false
        })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new apiError({
            status: 500,
            message: 'Failed to generate token',
        })
    }
}

const userRegister = asyncHandler( async(req, res) => {

    // get user details from frontend
    const { username, email, password, fullname } = req.body

    // validation - (not empty, pattren, password min digit)
    if(
        [username, email, password, fullname].some((feilds) => {
            return feilds?.trim() === ""
        })
    ){
        throw new apiError({
            status: 400,
            message: "Please fill all the fields"
        })
    }
    /* const checkEmailPattren = email.includes("@", 0);
    if(checkEmailPattren){
        throw new apiError({
            status: 400,
            message: "Please enter a valid email"
        })
    } */

    // check if user already exist (username, email)
    const checkUserExist = await User.findOne({ 
        $or: [{ username }, { email }] 
    })

    if(checkUserExist){
        throw new apiError({
            status: 409,
            message: "Username and email already exist"
        })
    }

    // check for images
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if(!avatarLocalPath){
        throw new apiError({
            status: 400,
            message: "Please upload an avatar"
        })
    }

    // upload images to cloudinary
    const avatar = await uploadOnCloudInary(avatarLocalPath)
    const coverImage = await uploadOnCloudInary(coverImageLocalPath)

    if (!avatar) {
        throw new apiError({
            status: 400,
            message: "Failed to upload avatar"
        })
    }

    // create user object - create entry in DB
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password,
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || '',
    })

    // remove password and refreshtoken from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    // check for user creation
    if(!createdUser){
        throw new apiError({
            status: 500,
            message: "Failed to create user"
        })
    }

    // send response
    return res.status(201).json(
        new apiResponse({
            status: 200,
            message: "User registered successfully",
            data: createdUser
        })
    )
})

const userLogin = asyncHandler( async(req, res) => {
    // get data from req body (from frontend)
    const { email, username, password } = req.body

    // check for username and email for which login is going to work
    if(!email && !username){
        throw new apiError({
            status: 400,
            message: "Please provide email or username"
        })
    }
    
    // find user 
    const user = await User.findOne({
        $or: [{ email }, { username }]
    })

    if(!user){
        throw new apiError({
            status: 401,
            message: "Invalid user not exist"
        })
    }

    // password check 
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new apiError({
            status: 401,
            message: "Invalid password"
        })
    }

    // generate access and refresh token
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshtoken")

    // send cookie and response
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new apiResponse({
            status: 200,
            message: "User logged in successfully",
            data: {
                user: loggedInUser, refreshToken, accessToken
            }
        })
    )
})

const userLogout = asyncHandler( async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true,
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new apiResponse({
            status: 200,
            message: "User logged out successfully",
            data: {}
        })
    )
})

const refreshAccessToken = asyncHandler( async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new apiError({
            status: 401,
            message: "unauthorized request"
        })
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new apiError({
                status: 401,
                message: "Invalid refresh token"
            })
        }
    
        if(incomingRefreshToken !== user?.refreshtoken){
            new apiError({
                status: 401,
                message: "Refresh token is expired or used"
            })
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const {accessToken, newRefreshtoken} = await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshtoken, options)
        .json(
            new apiResponse({
                status: 200,
                message: "Access token refreshed successfully",
                data: {
                    accessToken,
                    refreshToken: newRefreshtoken
                }
            })
        )
    } catch (error) {
        throw new apiError({
            status: 401,
            message: "Invalid refresh token"
        })
    }
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new apiResponse({
        status: 200,
        message: "User fetched successfully",
        data: req.user
    }))
})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword, confirmPassword} = req.body

    if(!(newPassword === confirmPassword)) {
        throw new apiError({
            status: 400,
            message: "Password and confirm password does not match"
        })
    }

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new apiError({
            status: 400,
            message: "Old password is incorrect"
        })
    }

    user.password = newPassword
    await user.save({
        validateBeforeSave: false
    })

    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Password changed successfully",
            data: {}
        })
    )
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullname, email} = req.body

    if(!fullname || !email){
        throw new apiError({
            status: 400,
            message: "All feilds are required"
        })
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email
            }
        },
        {
            new: true,
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Account details updated successfully",
            data: user
        })
    )
})

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new apiError({
            status: 400,
            message: "Please upload an image"
        })
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudInary(avatarLocalPath)

    if (!avatar.url) {
        throw new apiError({
            status: 500,
            message: "Error uploading avatar to cloudinary"
        })
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Avatar updated successfully",
            data: user
        })
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalFile = req.file?.path

    if (!coverImageLocalFile) {
        throw new apiError({
            status: 400,
            message: "Please upload an image"
        })
    }

    //TODO: delete old image - assignment

    const coverImage = await uploadOnCloudInary(coverImageLocalFile)

    if (!coverImage.url) {
        throw new apiError({
            status: 500,
            message: "Error uploading avatar to cloudinary"
        })
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "cover Image updated successfully",
            data: user
        })
    )
})

const getUserChannelProfile = asyncHandler(async(req, res) => {
    const { username } = req.params

    if(!username.trim()){
        throw new apiError({
            status: 400,
            message: "Username is missing"
        })
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond : {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            },
        },
        {
            $project: {
                _id: 1,
                username: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                fullname: 1,
                isSubscribed: 1,
                email: 1,
                avatar: 1,
                coverImage: 1
            }
        }
    ])

    if(!channel.length){
        throw new apiError({
            status: 400,
            message: "Channel not found",
        })
    }

    return res
    .status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Channel found",
            data: channel[0]
        })
    )
})

const getUserWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: new mongoose.Types.ObjectId(user.req?._id)
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "User watch history fetched successfully",
            data: user[0].watchHistory
        })
    )
})

export {
    userRegister,
    userLogin, 
    userLogout, 
    refreshAccessToken,
    getCurrentUser,
    updateUserAvatar, 
    updateUserCoverImage, 
    updateAccountDetails, 
    changeCurrentPassword, 
    getUserChannelProfile, 
    getUserWatchHistory 
}