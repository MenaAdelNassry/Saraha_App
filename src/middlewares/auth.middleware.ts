import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../models/user.model';
import { UserPayload } from '../services/auth.service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { TokenService } from '../services/token.service'

export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let token;

    // 1. Extract Token
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        throw new AppError("Not authorized, no token provided", 401);
    }

    // 2. Decode & Verify (JWT Logic Only)
    let decoded: UserPayload;
    
    try {
        // A. Decode to get Role
        const decodedPayload = jwt.decode(token) as UserPayload | null;
        
        if (!decodedPayload || !decodedPayload.role) {
            throw new AppError("Invalid token structure", 401);
        }
        
        // B. Verify Signature using the correct secret
        const signature = TokenService.getSecretKey(decodedPayload.role, 'access');
        decoded = jwt.verify(token, signature) as UserPayload;

    } catch (error: any) {
        console.error('JWT Error:', error.message);
        
        if (error instanceof AppError) throw error;
        if (error.name === 'TokenExpiredError') throw new AppError('Token expired, please login again', 401);
        if (error.name === 'JsonWebTokenError') throw new AppError('Invalid token signature', 401);

        throw new AppError('Not authorized, token failed', 401);
    }

    // 3. Check User Existence (Database Logic)
    const user = await UserModel.findById(decoded.id).select('-password');

    if (!user || user.isDeleted || !user.isConfirmed) {
        throw new AppError("The user belonging to this token no longer exists or freezed", 401);
    }

    // 4. Grant Access
    req.user = user;
    next();
});

export const optionalAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let token;

    // 1. Extract Token
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    // This refers to a user who does not have an account. 
    if (!token) {
        return next();
    }

    // 2. Decode & Verify (JWT Logic Only)
    let decoded: UserPayload;
    
    try {
        // A. Decode to get Role
        const decodedPayload = jwt.decode(token) as UserPayload | null;
        
        if (!decodedPayload || !decodedPayload.role) {
            throw new AppError("Invalid token structure", 401);
        }
        
        // B. Verify Signature using the correct secret 
        const signature = TokenService.getSecretKey(decodedPayload.role, 'access');
        decoded = jwt.verify(token, signature) as UserPayload;

    } catch (error: any) {
        console.error('JWT Error:', error.message);
        
        if (error instanceof AppError) throw error;
        if (error.name === 'TokenExpiredError') throw new AppError('Token expired, please login again', 401);
        if (error.name === 'JsonWebTokenError') throw new AppError('Invalid token signature', 401);

        throw new AppError('Not authorized, token failed', 401);
    }

    // 3. Check User Existence (Database Logic)
    const user = await UserModel.findById(decoded.id).select('-password');

    if (!user || user.isDeleted || !user.isConfirmed) {
        throw new AppError("The user belonging to this token no longer exists or freezed", 401);
    }

    // 4. Grant Access
    req.user = user;
    next();
});

export const allowedTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError("User not authenticated. Please login first.", 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(new AppError("You do not have permission to perform this action", 403));
        }

        next();
    };
};