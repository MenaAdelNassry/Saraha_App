import Joi from "joi";
import { generalFields } from "./generalFields.schema";

export const forgotPasswordSchema = Joi.object({
    email: generalFields.email.required()
});

export const resetPasswordSchema = Joi.object({
    email: generalFields.email.required(),
    code: Joi.string().length(6).required().messages({
        'string.length': 'Code must be 6 characters'
    }),
    newPassword: generalFields.password.required(),
    cPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
        'any.only': 'Confirm password does not match new password'
    })
});