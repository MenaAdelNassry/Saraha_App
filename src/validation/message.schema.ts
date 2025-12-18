import Joi from "joi";
import { generalFields } from "./generalFields.schema";

export const sendMessageSchema = Joi.object({
    content: Joi.string().min(1).max(2500).required(),
    receiverId: generalFields.objectId.required()
});

export const inboxSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
        'number.base': "Page must be a number",
        'number.min': "Page must be greater than or equal to 1"
    }),
    limit: Joi.number().integer().min(1).max(50).default(10).messages({
        'number.max': 'Limit cannot exceed 50 items per page'
    }),
}).unknown(true);

export const messageIdSchema = Joi.object({
    id: generalFields.objectId.required()
});