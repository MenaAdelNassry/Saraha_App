import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { AppError } from "../utils/AppError";

export const globalErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
    if (error instanceof multer.MulterError) {        
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            error = new AppError(
                `Unexpected field: '${error.field}'. Please use the correct field name (e.g., 'image') and Do not exceed the allowed number of images to be attached.`, 400
            );
        } else {
            error = new AppError(error.message, 400);
        }
    }

    // Default values
    error.statusCode = error.statusCode || 500;
    error.status = error.status || "error";

    // Development Mode => (More details)
    if(process.env.NODE_ENV === 'development') {
        res.status(error.statusCode).json({
            message: error.message,
            error,
            status: error.status,
            stack: error.stack
        });
    } else {
        if(error.isOperational) {
            res.status(error.statusCode).json({
                status: error.status,
                message: error.message
            });
        } else {
            console.error('ERROR 💥', error);
            res.status(500).json({
                status: 'error',
                message: 'Something went very wrong!'
            });
        }
    }
}