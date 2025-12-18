import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { deleteMessageService, getInboxMessagesService, markAsReadService, sendMessageService } from "../services/message.service";

export const sendMessage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { content, receiverId } = req.body;
    const senderId = req.user?._id;

    const message = await sendMessageService(receiverId, senderId?.toString(), content);
    res.status(201).json({ message: "Message sent successfully", data: message });
});

export const getInbox = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await getInboxMessagesService(limit, page, userId);
    res.status(200).json({
        status: 'success',
        message: 'Messages fetched successfully',
        data: result.messages,
        pagination: result.pagination
    });
});

export const markMessageAsRead = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!._id.toString();

    const updatedMessage = await markAsReadService(id, userId);

    res.status(200).json({
        status: 'success',
        message: 'Message marked as read',
        data: updatedMessage
    });
});

export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!._id.toString();

    await deleteMessageService(id, userId);

    res.status(200).json({
        status: 'success',
        message: 'Message deleted successfully'
    });
});