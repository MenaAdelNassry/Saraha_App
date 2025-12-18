import bcrypt from 'bcryptjs';
import UserModel, { roleEnum } from '../models/user.model';
import { JwtPayload } from 'jsonwebtoken';
import { IUser } from '../models/user.model';
import { AppError } from '../utils/AppError';
import { sendEmail } from '../utils/sendEmail';
import { getOtpTemplate } from '../utils/OtpTemplate';
import { Utils } from '../utils/utils';
import { TokenService } from './token.service';
import TokenModel from '../models/token.model';
import crypto from 'crypto';
import { restoreUserAccount } from './user.service';
import { OAuth2Client } from 'google-auth-library';

interface SignupData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    gender: string;
    phone?: string;
}

interface LoginData {
    email: string;
    password: string;
}

interface LoginResponse {
    user: IUser;
    accessToken: string;
    refreshToken: string;
}

export interface UserPayload extends JwtPayload {
    id: string;
    role: string;
}

export const confirmUserEmail = async (email: string, code: string) => {
    const user = await UserModel.findOne({ email }).select("+otpCode");

    if(!user) {
        throw new AppError("User not found", 404);
    }
    
    if(user.isConfirmed) {
        throw new AppError("Email is already confirmed", 400);
    }
    
    if(user.otpAttempts >= 3) {
        throw new AppError("Too many failed attempts. Please request a new code.", 429);
    }
    
    if(!user.otpExpires || user.otpExpires.getTime() < Date.now()) {
        throw new AppError("Code expired. Please request a new one.", 400);
    }

    const isMatch = await bcrypt.compare(code, user.otpCode || "");
    if(!isMatch) {
        user.otpAttempts++;
        await user.save();
        throw new AppError(`Invalid code. ${3 - user.otpAttempts} attempts left.`, 400);
    }

    // Success
    user.isConfirmed = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;

    await user.save();
    return { message: "Email confirmed successfully. You can login now." };
}

export const resendOtpCode = async (email: string) => {
    const user = await UserModel.findOne({ email });

    if(!user) {
        throw new AppError("User not found", 404);
    }
    
    if(user.isConfirmed) {
        throw new AppError("Email is already confirmed", 400);
    }

    // Generate New OTP
    const otp = Utils.getRandomIntInclusive(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 12);

    // Update User
    user.otpAttempts = 0;
    user.otpCode = hashedOtp;
    user.otpExpires = new Date(Date.now() + 2 * 60 * 1000);

    await user.save();

    // Send Email
    try {
        await sendOtpEmail(user, otp, "2", "Saraha App - Verify your email", "Verify Your Email");
    } catch (error) {
        console.error("Failed to send resend-OTP email", error);
        throw new AppError("Failed to send email. Please try again later.", 500);
    }

    return { message: "New code sent to your email." };
}

export const sendOtpEmail = async (user: IUser, otp: string, expireDate: string, subject: string, title: string) => {
    const template = getOtpTemplate({
        imageUrl: "https://res.cloudinary.com/dpjqyf1hm/image/upload/v1765818107/saraha-logo_ufza5q.png",
        date: Utils.getCurrentDate(),
        receiverName: user.fullName || user.firstName,
        expireDate,
        otp,
        title
    });

    await sendEmail({
        to: user.email,
        subject,
        html: template
    });
};

export const registerUser = async (userData: SignupData): Promise<IUser> => {
    // 1. Check Duplication
    const existingUser = await UserModel.findOne({ email: userData.email });
    if(existingUser) throw new AppError("Email already exists", 409);

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // 3. OTP Logic
    const otp = Utils.getRandomIntInclusive(100000, 999999).toString();
    const hashedOTP = await bcrypt.hash(otp, 12);
    
    // 4. Create User
    const newUser = await UserModel.create({
        ...userData,
        password: hashedPassword,
        role: roleEnum.USER,
        isConfirmed: false,
        otpCode: hashedOTP,
        otpExpires: Date.now() + 2 * 60 * 1000,
        otpAttempts: 0
    });
    
    // 5. Send Email
    try {
        await sendOtpEmail(newUser, otp, "2", "Saraha App - Verify your email", "Verify Your Email");
    } catch (error) {
        await newUser.deleteOne(); 
        throw new AppError("Failed to send verification email.", 500);
    }

    return newUser;
}

export const loginUser = async (loginData: LoginData): Promise<LoginResponse> => {
    // 1. Find User
    const existingUser = await UserModel.findOne({ email: loginData.email }).select('+password');
    if(!existingUser || !existingUser.isConfirmed) {
        throw new AppError('Invalid credentials or email not confirmed', 401);
    }

    // 2. Check Password
    const isMatch = await bcrypt.compare(loginData.password, existingUser.password);
    if (!isMatch) throw new AppError('Invalid email or password', 401);

    // 👇 3. Dealing With Frozen User
    if (existingUser.isDeleted) {
        if (existingUser.deletedBy?.toString() === existingUser._id.toString()) {
            await restoreUserAccount(existingUser._id.toString(), existingUser._id.toString());
            existingUser.isDeleted = false;
        } 
        else {
            throw new AppError('Your account has been banned by admin.', 403);
        }
    }

    // 👇 4. Generate Tokens
    const accessToken = TokenService.generateAccessToken(existingUser);
    const refreshToken = await TokenService.generateRefreshToken(existingUser);

    return { user: existingUser, accessToken, refreshToken };
}

export const refreshAccessToken = async (token: string) => {
    // Verify Token
    const userId = await TokenService.verifyAndRotateRefreshToken(token);

    // Find User And Check If Frozen
    const user = await UserModel.findById(userId);
    if(!user || user.isDeleted) throw new AppError("User not found or deactivated", 403);

    // Generate New Tokens
    const newAccessToken = TokenService.generateAccessToken(user);
    const newRefreshToken = await TokenService.generateRefreshToken(user);

    return { newAccessToken, newRefreshToken };
}

export const forgotPasswordService = async (email: string): Promise<string> => {
    // 1. Get user and check from its existance and validation
    const user = await UserModel.findOne({ email });
    
    if(!user || user.isDeleted) {
        throw new AppError("Email not found or account is not active", 404);
    }
    
    // 2. Generate OTP
    const resetCode = Utils.getRandomIntInclusive(100000, 999999);
    
    // 3. Hash OTP
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(resetCode.toString(), salt);
    
    // 4. Save To DB
    user.passwordResetCode = hashedOTP;
    user.passwordResetExpires = new Date(Date.now() + 2 * 60 * 1000); // mins
    user.passwordResetVerified = false;
    user.save();
    
    // 5. Send Email To User
    try {
        await sendOtpEmail(user, resetCode.toString(), "2", "Password Reset Code", "Password Reset Code")
    } catch (error) {
        user.passwordResetCode = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        throw new AppError("Error sending email", 500);
    }

    return "Password reset code sent to your email";
}

export const resetPasswordService = async (email: string, code: string, newPass: string): Promise<string> => {
    // 1. Get user
    const user = await UserModel.findOne({ email }).select("+passwordResetCode +passwordResetExpires");
    
    if(!user || user.isDeleted) {
        throw new AppError("Email not found or account is not active", 404);
    }
    
    // 2. Check if code is valid
    if(!user.passwordResetExpires || user.passwordResetExpires.getTime() < Date.now()) {
        throw new AppError("Code expired or invalid", 400);
    }
    
    const isMatch = await bcrypt.compare(code, user.passwordResetCode!);
    if(!isMatch) {
        throw new AppError("Invalid code", 400);
    }

    // 3. Hash New Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPass, salt);

    // 4. Execute
    await UserModel.updateOne({ _id: user._id },
        {
            $set: {
                password: hashedPassword,
                // passwordChangedAt: new Date(),
            },
            $unset: {
                passwordResetCode: 1,
                passwordResetExpires: 1,
                passwordResetVerified: 1
            }
        }
    );

    return "Password reset successfully";
}

export const logoutService = async (refreshToken: string, userId: string): Promise<string> => {
    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');;
    await TokenModel.deleteOne({ token: hashedRefreshToken, userId });
    return "Logged out successfully";
}

export const logoutAllService = async (userId: string): Promise<string> => {
    await TokenModel.deleteMany({ userId });
    return "Logged out from all devices successfully";
}

export const loginWithGoogleService = async (idToken: string): Promise<LoginResponse> => {
    const client = new OAuth2Client(process.env.GOOGLE_CONSOLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CONSOLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if(!payload || !payload.email) {
        throw new AppError("Invalid Google Token", 400);
    }

    const { email, name, picture, sub: googleId } = payload;

    let user = await UserModel.findOne({ email });

    if(user) {
        if(!user.googleId) user.googleId = googleId;
        if(!user.isConfirmed) user.isConfirmed = true;

        await user.save();
    } else {
        const randomPassword = Math.random().toString(36).slice(-8) + process.env.JWT_SECRET;
        const firstName = payload.given_name || "User";
        const lastName = payload.family_name || "Google";

        user = await UserModel.create({
            firstName,
            lastName,
            email,
            googleId,
            password: randomPassword,
            isConfirmed: true,
            profilePic: { secure_url: picture, public_id: null }
        });
    }

    return {
        accessToken: TokenService.generateAccessToken(user),
        refreshToken: await TokenService.generateRefreshToken(user),
        user
    }
}