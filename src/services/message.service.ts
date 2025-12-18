import { IMessage, MessageModel } from "../models/message.model";
import UserModel from "../models/user.model";
import { AppError } from "../utils/AppError";

export const sendMessageService = async (receiverId: string, senderId: string | undefined, content: string): Promise<IMessage> => {
    // 1. Check if receiver exist or banned or confirmed
    const receiver = await UserModel.findById(receiverId);
    if(!receiver || receiver.isDeleted || !receiver.isConfirmed) {
        throw new AppError("Receiver not found",  404);
    }
    
    // 2. Check if sender equal receiver
    if(senderId && senderId.toString() === receiverId.toString()) {
        throw new AppError("You cannot send a message to yourself", 400);
    }
    
    // 3. Create message
    const message = await MessageModel.create({
        receiverId,
        senderId,
        content
    });

    return message;
}

export const getInboxMessagesService = async (limit: number = 10, page: number = 1, userId: string) => {
    const skip = (page - 1) * limit
    const query = { receiverId: userId, isDeleted: false };

    const messages = await MessageModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-__v");
    
    const totalMessages = await MessageModel.countDocuments(query);
    const totalPages = Math.ceil(totalMessages / limit);

    return {
        messages,
        pagination: {
            totalMessages,
            totalPages,
            currentPage: page,
            itemsPerPage: limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    };
}

export const markAsReadService = async (messageId: string, userId: string): Promise<IMessage> => {
    const message = await MessageModel.findById(messageId);

    if(!message || message.isDeleted) {
        throw new AppError("Message not found", 404);
    }

    if(message.receiverId.toString() !== userId) {
        throw new AppError("You are not authorized to view this message", 403);
    }

    message.isViewed = true;
    message.save();

    return message;
}

export const deleteMessageService = async (messageId: string, userId: string): Promise<string> => {
    const message = await MessageModel.findById(messageId);

    if(!message || message.isDeleted) {
        throw new AppError("Message not found", 404);
    }

    if(message.receiverId.toString() !== userId) {
        throw new AppError("You are not authorized to delete this message", 403);
    }

    message.isDeleted = true;
    message.save();

    return "Message deleted successfully";
}
