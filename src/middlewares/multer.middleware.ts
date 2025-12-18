import { Request } from "express";
import multer from "multer"
import fs from "node:fs";
import path from "node:path";
import { AppError } from "../utils/AppError";

const uploadFolderPath = path.resolve(__dirname, '../../uploads');

if(!fs.existsSync(uploadFolderPath)) {
    fs.mkdirSync(uploadFolderPath);
}

export const validationTypes = {
    image: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
    pdf: ['application/pdf']
}

export const multerHost = (customValidation = validationTypes.image) => {
    // 1. Storage Configuration (Disk Storage)
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadFolderPath);
        },
        
        filename: (req, file, cb) => {
            cb(null, Date.now() + "-" + file.originalname);
        }
    });
    
    // 2. Filter Setup
    const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        if(!customValidation.includes(file.mimetype)) {
            cb(new AppError('Invalid file format', 400) as any, false);
        } else {
            cb(null, true);
        }
    }
    
    // 3. Multer Middleware
    return multer({ storage, fileFilter });
}