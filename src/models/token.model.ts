import mongoose, { Schema, Types } from "mongoose";

export interface IToken extends Document {
    userId: Types.ObjectId;
    token: string;
    createdAt: Date;
    expiresAt: Date;
}

const tokenSchema: Schema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: process.env.REFRESH_TOKEN_EXPIRE_DATE || "7d"
    }
});

const TokenModel = mongoose.model<IToken>('Token', tokenSchema);
export default TokenModel;