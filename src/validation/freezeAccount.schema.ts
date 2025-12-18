import Joi from "joi";
import { generalFields } from "./generalFields.schema";

export const freezeAccountSchema = Joi.object({
    userId: generalFields.objectId.optional()
});