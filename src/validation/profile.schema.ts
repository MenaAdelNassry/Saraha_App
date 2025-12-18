import Joi from "joi";
import { generalFields } from "./generalFields.schema";

const objectIdSchema = generalFields.objectId.required();
export const profileSchema = Joi.object({
    id: objectIdSchema
});