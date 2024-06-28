import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { apiError } from './apiError';
import { apiResponse } from './apiResponse';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudInary = async(localFilePath) => {
    try {
        if(!localFilePath) return null;
        const uploadResult = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        console.log("file is uploaded on cloundinary ",uploadResult);
        if(uploadResult){
            fs.unlinkSync(localFilePath);
        }
        return uploadResult;
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove file where operations failed
        return null;
    }
}

const deleteFromCloudInary = async(public_id) => {
    try {
        await cloudinary.uploader.destroy(public_id);
        return new apiResponse({
            status: 200,
            message: "file is deleted from cloundinary",
            data: {}
        })
    } catch (error) {
        throw new apiError({
            status: 500,
            message: "Error while deleting file from cloudinary",
        })
    }
}

export { uploadOnCloudInary, deleteFromCloudInary }