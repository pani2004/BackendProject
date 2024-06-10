import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from 'dotenv'
dotenv.config()
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.CLOUDINARY_API_SECRET 
});

const uploadonCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            console.error("Local file path is missing");
            return null;
        }

        console.log("Uploading file to Cloudinary:", localFilePath);

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        console.log("File uploaded to Cloudinary:", response.url);

        // Remove the locally saved temporary file
        fs.unlinkSync(localFilePath);

        return response;
    } catch (err) {
        console.error("Error uploading to Cloudinary:", err);

        // Remove the locally saved temporary file
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        throw err; // Re-throw the error to handle it in the caller function
    }
};

export { uploadonCloudinary };

