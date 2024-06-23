import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../modals/user.modal.js'
import { uploadOnCloudInary } from '../utils/cloudinary.js'
import { apiError } from '../utils/apiError.js'
import { apiResponse } from '../utils/apiResponse.js'

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

export { userRegister }