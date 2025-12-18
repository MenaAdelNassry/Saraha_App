import UserModel, { IUser } from "../models/user.model"
import { AppError } from "../utils/AppError";
import bcrypt from 'bcryptjs';
import { logoutAllService } from "./auth.service";
import { deleteImage, uploadImage } from "../utils/cloudinary";
import fs from 'fs';

interface UpdateUserData {
    firstName?: string;
    lastName?: string;
    gender?: string;
    phone?: string;
}

export const getUserProfile = async (userId: string, isMe: boolean = false) => {
    const propertiesForUserHimself = `${isMe ? "email phone" : ""}`;
    const user = await UserModel.findById(userId).select(`firstName lastName gender profilePic.secure_url ${propertiesForUserHimself}`);
    
    if(!user) {
        throw new AppError("User not found", 404);
    }

    return user;
}

export const updateUserProfile = async (userId: string, data: UpdateUserData) => {
    const updatedUser = await UserModel.findOneAndUpdate(
        { _id: userId },
        data,
        { new: true, runValidators: true }
    ).select("firstName lastName email _id gender phone");

    if(!updatedUser) {
        throw new AppError("User not found", 404);
    }

    return updatedUser;
}

export const freezeUser = async (freezedUserId: string, actorId: string, isAdmin: boolean): Promise<string> => {
    // 1. Check Authorization
    if(freezedUserId !== actorId && !isAdmin) {
        throw new AppError("Not authorized account", 403);
    }
    
    // 2. Prepare Query (Admin Override Logic)
    const filterQuery = isAdmin 
    ? { _id: freezedUserId }
    : { _id: freezedUserId, isDeleted: false };

    // 3. Execute
    const user = await UserModel.findOneAndUpdate(filterQuery, {
        $set: 
        {
            isDeleted: true,
            deletedBy: actorId,
            deletedAt: new Date(),
        },
        $unset: 
        {
            restoredAt: 1,
            restoredBy: 1
        }
    }, { new: true });

    // 4. Feedback Logic
    if (!user) {
        throw new AppError("User not found or already frozen", 404);
    }
    
    // 5. Logout From All Devices
    await logoutAllService(user._id.toString());

    return freezedUserId !== actorId ? "User banned successfully" : "Account deactivated successfully";;
}

export const restoreUserAccount = async (freezedUserId: string, actorId: string): Promise<string> => {
    const user = await UserModel.findOneAndUpdate({ _id: freezedUserId, isDeleted: true }, {
        $set:
        { 
            isDeleted: false,
            restoredAt: new Date(),
            restoredBy: actorId,
        },
        $unset: 
        { 
            deletedBy: 1, 
            deletedAt: 1
        }
    }, { new: true });

    if (!user) {
        throw new AppError("User not found or already active", 404);
    }

    return "Account activated successfully";
}

export const deleteUserAccount = async (freezedUserId: string): Promise<string> => {
    const user = await UserModel.findOneAndDelete({ _id: freezedUserId, isDeleted: true });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    // TODO: ⚠️ Uncomment this lines when Message Module is ready
    // await MessageModel.deleteMany({ receiverId: userId });
    // await MessageModel.deleteMany({ senderId: userId });

    return "User and all associated data deleted successfully";
}

export const updatePasswordService = async (userId: string, oldPassword: string, newPassword: string): Promise<string> => {
    const user = await UserModel.findById(userId).select("+password");

    if(!user) {
        throw new AppError("User not found", 404);
    }
    
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if(!isMatch) {
        throw new AppError("Incorrect old password", 400);
    }

    // TODO: Implement Password History Check here in the future (Limit 5) ⏳

    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    await UserModel.updateOne({ _id: userId }, { password: newHashedPassword });

    await logoutAllService(user._id.toString());

    return "Password updated successfully";
}

export const uploadImageService = async (userId: string, file: Express.Multer.File): Promise<IUser> => {
    try {
        // 1. Get User From DB
        const user = await UserModel.findById(userId);
        if(!user) throw new AppError("User not found", 404);
        
        // 2. Remove Prev Profile Picture In Cloud
        if(user.profilePic?.public_id) {
            await deleteImage(user.profilePic?.public_id);
        }
        
        // 3. Upload New Image To Cloudinary
        const { secure_url, public_id } = await uploadImage(file.path, "saraha/avatars");
        
        // 4. Update Profile pic In DB
        user.profilePic!.secure_url = secure_url;
        user.profilePic!.public_id = public_id;
        await user.save();

        return user;
    } finally {
        // 5. Delete temp Image from Local Storage
        if (file?.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
    }
}