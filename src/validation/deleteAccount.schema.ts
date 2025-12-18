import Joi from "joi";
import { generalFields } from "./generalFields.schema";

export const deleteUserSchema = Joi.object({
    userId: generalFields.objectId.required()
});