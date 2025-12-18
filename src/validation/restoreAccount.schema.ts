import Joi from "joi";
import { generalFields } from "./generalFields.schema";

export const restoreAccountSchema = Joi.object({
    userId: generalFields.objectId.required()
});