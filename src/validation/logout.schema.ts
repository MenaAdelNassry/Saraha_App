import Joi from "joi";
import { generalFields } from "./generalFields.schema";

export const logoutSchema = Joi.object({
    token: Joi.string().required(),
});