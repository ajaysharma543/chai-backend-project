import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "./ApiError.js";


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});
export const deleteFromCloudinary = async (imageUrl) => {
 try {
    if (!imageUrl) return;
    const parts = imageUrl.split("/");
    const lastPart = parts[parts.length - 1]; // e.g., abc123.jpg
    const publicId = lastPart.split(".")[0];   // abc123

    const result = await cloudinary.uploader.destroy(publicId);
    return result;
} catch (error) {
    throw new ApiError(400, "image cant be deleted")
}
    
};
