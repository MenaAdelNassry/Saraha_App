import Joi from "joi";
import { generalFields } from "./generalFields.schema";

export const updatePasswordSchema = Joi.object({
    oldPassword: generalFields.password.required(),
    newPassword: generalFields.password.invalid(Joi.ref("oldPassword")).required().messages({
        'any.invalid': "New password must be different from old password"
    }),
    confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required().messages({
        'any.only': 'Confirm password does not match new password'
    }),
});