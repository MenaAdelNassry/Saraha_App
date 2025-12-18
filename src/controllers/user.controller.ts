import { Request, Response } from "express";
import { deleteUserAccount, freezeUser, getUserProfile, restoreUserAccount, updatePasswordService, updateUserProfile, uploadImageService } from "../services/user.service";
import { asyncHandler } from "../utils/asyncHandler";
import { roleEnum } from "../models/user.model";
import { AppError } from "../utils/AppError";

export const getProfile = asyncHandler( async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const user = await getUserProfile(id);

    res.status(200).json({
        message: "User profile fetched successfully",
        user
    });
});

export const getMyProfile = asyncHandler( async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const user = await getUserProfile(userId, true);

    res.status(200).json({
        message: "User profile fetched successfully",
        user
    });
});

export const updateProfile = asyncHandler( async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const { firstName, lastName, gender, phone } = req.body;

    const updatedUser = await updateUserProfile(userId, {
        firstName, lastName, phone, gender
    });

    res.status(200).json({
        message: "Profile updated successfully",
        user: updatedUser
    });
});

export const freezeAccount = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // 1. Determine Actor and Freezed and isAdmin
    const { userId } = req.params;
    
    const freezedUserId = userId ? userId : req.user!._id.toString();
    const actorId = req.user!._id.toString();
    const isAdmin = req.user?.role === roleEnum.ADMIN;
    
    // 2. Freeze User
    const message = await freezeUser(freezedUserId, actorId, isAdmin);

    res.status(200).json({ message });
});

export const restoreAccount = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;   
    const actorId = req.user!._id.toString();
    const message = await restoreUserAccount(userId, actorId);

    res.status(200).json({ message });
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;   

    const message = await deleteUserAccount(userId);

    res.status(200).json({ message });
});

export const updatePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { oldPassword, newPassword } = req.body;

    const message = await updatePasswordService(req.user!._id.toString(), oldPassword, newPassword);

    res.status(200).json({ message });
});

export const uploadProfilePic = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if(!req.file) {
        throw new AppError('Please upload an image', 400);
    }

    const userId = req.user!._id.toString();
    const updatedUser = await uploadImageService(userId, req.file);

    res.status(200).json({
        message: "Profile picture updated successfully",
        user: updatedUser
    });
});