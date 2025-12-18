import { Router } from "express";
import { optionalAuth, protect } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import { inboxSchema, messageIdSchema, sendMessageSchema } from "../validation/message.schema";
import { deleteMessage, getInbox, markMessageAsRead, sendMessage } from "../controllers/message.controller";

const router = Router();

router.post("/", optionalAuth, validate(sendMessageSchema), sendMessage);

router.get("/", protect, validate(inboxSchema, 'query'), getInbox);

router.patch("/:id/read", protect, validate(messageIdSchema, 'params'), markMessageAsRead);

router.delete("/:id/delete", protect, validate(messageIdSchema, 'params'), deleteMessage);

export default router;