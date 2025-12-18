import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
    content: string;
    receiverId: Types.ObjectId;
    senderId?: Types.ObjectId | null; 
    isAnonymous: boolean; 
    isViewed: boolean;
    isDeleted: boolean;
}

const messageSchema = new Schema<IMessage>({
    content: {
        type: String,
        required: [true, 'Message content is required'],
        trim: true,
        minlength: [1, 'Message cannot be empty'],
    },
    receiverId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true, 
    },
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null, 
    },
    isAnonymous: {
        type: Boolean,
        default: true,
    },
    isViewed: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export const MessageModel = mongoose.model<IMessage>('Message', messageSchema);