import mongoose, { Document, Schema } from "mongoose";

export const genderEnum = { MALE: "Male", FEMALE: "Female" };
export const roleEnum = { USER: "user", ADMIN: "admin" };

interface IProfilePic {
    secure_url: string;
    public_id: string | null;
}

export interface IUser extends Document {
    firstName: string;
    lastName: string;
    password: string;
    email: string;
    gender: string;
    phone?: string;
    isDeleted?: boolean;
    deletedAt?: Date;
    deletedBy?: string;
    restoredAt?: Date;
    restoredBy?: string;
    fullName?: string;
    role: string;
    isConfirmed?: boolean;
    createdAt: Date;
    otpCode?: string;
    otpExpires?: Date;
    otpAttempts: number;
    passwordResetCode?: string;
    passwordResetExpires?: Date;
    passwordResetVerified?: boolean;
    profilePic?: IProfilePic;
    googleId?: string;
}

const userSchema: Schema = new Schema({
    firstName: { type: String, required: true, minLength: 2, maxLength: 20, trim: true },
    lastName: { type: String, required: true, minLength: 2, maxLength: 20, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    gender: { 
        type: String, 
        enum: Object.values(genderEnum),
        default: genderEnum.MALE
    },
    role: { 
        type: String, 
        enum: Object.values(roleEnum),
        default: roleEnum.USER
    },
    phone: String,
    isConfirmed: { type: Boolean, default: false },
    otpCode: { 
        type: String, 
        select: false
    },
    otpExpires: { 
        type: Date, 
        default: null 
    },
    otpAttempts: { 
        type: Number, 
        default: 0 
    },
    isDeleted: {
        type: Boolean, // it's better at searching than (Date type)
        default: false
    },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    restoredAt: { type: Date },
    restoredBy: { type: Schema.Types.ObjectId, ref: "User" },
    passwordResetCode: { 
        type: String, 
        select: false
    },
    passwordResetExpires: { 
        type: Date, 
        select: false 
    },
    passwordResetVerified: { 
        type: Boolean, 
        default: false 
    },
    profilePic: {
        secure_url: {
            type: String,
            default: "https://res.cloudinary.com/dpjqyf1hm/image/upload/v1765981349/download_polf6v.png"
        },
        public_id: {
            type: String,
            default: null,
        }
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false
});

userSchema.virtual("fullName").set(function (value) {
    const [firstName, lastName] = value.split(" ") || [];
    this.set({ firstName, lastName });
}).get(function () {
    return this.firstName + " " + this.lastName;
});

const UserModel = mongoose.model<IUser>("User", userSchema);
export default UserModel;