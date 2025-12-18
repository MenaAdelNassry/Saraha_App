import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';

export const signup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Layer 1: Call Service
    const newUser = await authService.registerUser(req.body);

    // Layer 2: Send Response
    res.status(201).json({
        message: 'User created. Please check your email to verify account.',
        user: {
            _id: newUser._id,
            email: newUser.email,
            fullName: newUser.fullName
        }
    });
});

// TODO: [Security Refactor] Move Refresh Token to HttpOnly Cookie
// Current Implementation: We send refreshToken in the JSON body.
// Risk: If frontend stores this in 'localStorage', it is vulnerable to XSS attacks (malicious JS can read it).
// Future Plan: Send refreshToken as a 'secure, httpOnly' cookie.
// Benefit: httpOnly cookies are inaccessible to client-side JavaScript, making them immune to XSS token theft.
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // 1. Service Call
    const { user, accessToken, refreshToken } = await authService.loginUser(req.body);

    // 2. Response
    res.status(200).json({
        message: 'Logged in successfully',
        accessToken,
        refreshToken,
        user: {
            _id: user._id,
            email: user.email,
            fullName: user.fullName
        }
    });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body;

    if(!token) {
        throw new AppError("Refresh Token is required", 400);
    }

    const result = await authService.refreshAccessToken(token);

    res.status(200).json({
        message: 'Token refreshed successfully',
        ...result
    });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, code } = req.body;

    if (!email || !code) {
        throw new AppError("Email and Code are required", 400);
    }

    const result = await authService.confirmUserEmail(email, code);

    res.status(200).json(result);
});

export const resendCode = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    if (!email) {
        throw new AppError("Email is required", 400);
    }

    const result = await authService.resendOtpCode(email);

    res.status(200).json(result);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;
    const message = await authService.forgotPasswordService(email);
    res.status(200).json({ message });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, code, newPassword } = req.body;
    const message = await authService.resetPasswordService(email, code, newPassword);
    res.status(200).json({ message });
});

export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body;
    const userId = req.user!._id.toString();
    const message = await authService.logoutService(token, userId);
    res.status(200).json({ message });
});

export const logoutAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const message = await authService.logoutAllService(userId);
    res.status(200).json({ message });
});

export const loginWithGoogle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { idToken } = req.body;

    if (!idToken) {
        throw new AppError("Google ID Token is required", 400);
    }

    const { accessToken, refreshToken, user } = await authService.loginWithGoogleService(idToken);

    res.status(200).json({
        status: 'success',
        message: 'Logged in with Google successfully',
        accessToken,
        refreshToken,
        user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            role: user.role
        }
    });
});