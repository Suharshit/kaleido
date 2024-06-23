import { asyncHandler } from '../utils/asyncHandler.js'

const userRegister = asyncHandler( async(req, res) => {
    // Register user logic here
    res.status(401).json(
        {
            success: true,
            message: "code is running! no error detected"
        }
    )
})

export { userRegister }