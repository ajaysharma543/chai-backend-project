import { v2 as cloudinary } from "cloudinary";


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});
export const deleteFromCloudinary = async (imageUrl) => {
    if (!imageUrl) return;
    const parts = imageUrl.split("/");
    const lastPart = parts[parts.length - 1]; // e.g., abc123.jpg
    const publicId = lastPart.split(".")[0];   // abc123

    const result = await cloudinary.uploader.destroy(publicId);
    return result;
    
};
