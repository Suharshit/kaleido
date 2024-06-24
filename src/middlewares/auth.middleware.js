import { User } from "../modals/user.modal.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler( async(req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header( 'Authorization' )?.replace( 'Bearer ', '' )
        if(!token){
            new apiError({
                status:401,
                message:"Unauthorized request"
            })
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshtoken")
        if(!user){
            new apiError({
                status:401,
                message: "Invalid AccessToken"
            })
        }
        
        req.user = user
        next()
    } catch (error) {
        throw apiError({
            status:401,
            message: error?.message || "Invalid AccessToken"
        })
    }
})