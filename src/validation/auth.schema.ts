import Joi from "joi";
import { generalFields } from "./generalFields.schema";

export const signupSchema = Joi.object({
    firstName: generalFields.firstName.required(),
    lastName: generalFields.lastName.required(),
    email: generalFields.email.required(),
    password: generalFields.password.required(),
    gender: generalFields.gender.default('Male'),
    phone: generalFields.phone.optional()
});

export const loginSchema = Joi.object({
    email: generalFields.email.required(),
    password: generalFields.password.required()
});

export const updateProfileSchema = Joi.object({
    firstName: generalFields.firstName,
    lastName: generalFields.lastName,
    gender: Joi.string().valid('Male', 'Female').optional(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional() 
}).min(1);