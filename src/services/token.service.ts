import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import TokenModel from '../models/token.model';
import { IUser, roleEnum } from '../models/user.model';
import { AppError } from '../utils/AppError';

export class TokenService {
    
    // 1. Helper to get secrets
    static getSecretKey(role: string, type: 'access' | 'refresh'): string {
        if (type === 'access') {
            return role === roleEnum.USER 
                ? process.env.ACCESS_JWT_USER_SECRET as string 
                : process.env.ACCESS_JWT_SECRET_ADMIN as string;
        } else {
            return role === roleEnum.USER 
                ? process.env.REFRESH_TOKEN_SECRET_USER as string 
                : process.env.REFRESH_TOKEN_SECRET_ADMIN as string;
        }
    }

    // 2. Generate Access Token
    static generateAccessToken(user: IUser): string {
        const secret = this.getSecretKey(user.role as string, 'access');
        return jwt.sign(
            { id: user._id, role: user.role },
            secret,
            { expiresIn: (process.env.ACCESS_JWT_EXPIRE_DATE || '15m') as any }
        );
    }

    // 3. Generate & Store Refresh Token
    static async generateRefreshToken(user: IUser): Promise<string> {
        const secret = this.getSecretKey(user.role as string, 'refresh');
        const refreshToken = jwt.sign(
            { id: user._id, role: user.role },
            secret,
            { expiresIn: (process.env.REFRESH_TOKEN_EXPIRE_DATE || '7d') as any }
        );

        // Hashing logic moved here
        const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

        await TokenModel.create({
            userId: user._id,
            token: hashedToken,
            createdAt: Date.now()
        });

        return refreshToken;
    }

    // 4. Verify & Rotate Refresh Token (Complex Logic moved here)
    static async verifyAndRotateRefreshToken(token: string) {
        // Decode
        const decodedPayload = jwt.decode(token) as any;
        if (!decodedPayload?.role || !decodedPayload?.id) {
            throw new AppError("Invalid token structure", 403);
        }

        // Verify Signature
        const secret = this.getSecretKey(decodedPayload.role, 'refresh');
        try {
            jwt.verify(token, secret);
        } catch (error) {
            throw new AppError("Refresh token expired or invalid", 403);
        }

        // DB Check
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const userToken = await TokenModel.findOne({ userId: decodedPayload.id, token: hashedToken });

        if (!userToken) {
            throw new AppError("Refresh token is not valid or reused!", 403);
        }

        // Rotation: Delete old token
        await userToken.deleteOne();

        return decodedPayload.id; // Return User ID to be used by Auth Service
    }
}