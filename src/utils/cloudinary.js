import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

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
        console.log("file is uploaded on cloundinary ",uploadResult.url);
        if(uploadResult){
            fs.unlinkSync(localFilePath);
        }
        return uploadResult;
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove file where operations failed
        return null;
    }
}

export { uploadOnCloudInary }