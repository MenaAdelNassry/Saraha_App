import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { AppError } from './AppError';
dotenv.config();

interface IUploadImageSuccessResponse {
    secure_url: string;
    public_id: string;
}

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
    secure: true
});

export const deleteImage = async (public_id: string): Promise<boolean> => {
    try {
        await cloudinary.uploader.destroy(public_id);
        return true;
    } catch (error) {
        console.log(`Error in cloudinary: ${error}`);
        throw new AppError("something went wrong on the website's server", 500);
    }
}

export const uploadImage = async (path: string, folder: string): Promise<IUploadImageSuccessResponse> => {
    try {
        const result = await cloudinary.uploader.upload(path, { folder });
        return { 
            secure_url: result.secure_url, 
            public_id: result.public_id 
        };
    } catch (error) {
        console.log(`Error in cloudinary: ${error}`);
        throw new AppError("something went wrong on the website's server", 500);
    }
}

export default cloudinary;


/**
    TODO: Optimization for Production (Serverless / High Scale)
 * Currently, we use DiskStorage: Client -> Server Disk (Temp) -> Cloudinary -> Delete from Disk.
 * * Future Improvement: Use 'multer-storage-cloudinary' or 'MemoryStorage'.
 * This allows piping the stream directly: Client -> RAM -> Cloudinary.
 * Benefits: No disk I/O, faster uploads, works on read-only file systems (like Vercel/AWS Lambda).
*/