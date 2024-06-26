import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../modals/user.modal.js'
import { uploadOnCloudInary } from '../utils/cloudinary.js'
import { apiError } from '../utils/apiError.js'
import { apiResponse } from '../utils/apiResponse.js'
import jwt from 'jsonwebtoken'

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

const updateUserAvatarAndCoverImage = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.files?.avatar[0].path
    const coverImageLocalPath = req.files?.coverImage[0].path

    if(!avatarLocalPath && !coverImageLocalPath){
        throw new apiError({
            status: 400,
            message: "Both avatar and cover image are required"
        })
    }

    const avatar = await uploadOnCloudInary(avatarLocalPath)
    const coverImage = await uploadOnCloudInary(coverImageLocalPath)

    if(!avatar && !coverImage){
        throw new apiError({
            status: 500,
            message: "Error uploading avatar and cover image"
        })
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar,
                coverImage
            }
        },
        {
            new: true,
        }
    ).select("-password")

    return res.status(200)
    .json(
        new apiResponse({
            status: 200,
            message: "Avatar and coverImage updated successfully",
        })
    )
})

export { userRegister, userLogin, userLogout, refreshAccessToken, updateUserAvatarAndCoverImage, updateAccountDetails, changeCurrentPassword }