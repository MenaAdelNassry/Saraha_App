import Joi from "joi";

export const generalFields = {
  firstName: Joi.string().min(2).max(20).messages({
    "string.empty": "First name is required",
    "string.min": "First name must be at least 2 chars",
    "string.max": "First name cannot exceed 20 chars",
  }),
  lastName: Joi.string().min(2).max(20).messages({
    "string.empty": "Last name is required",
    "string.min": "Last name must be at least 2 chars",
    "string.max": "Last name cannot exceed 20 chars",
  }),
  email: Joi.string().email().messages({
    "string.email": "Please provide a valid email address",
  }),
  password: Joi.string()
    .pattern(new RegExp("^[a-zA-Z0-9]{6,30}$"))

    .messages({
      "string.pattern.base":
        "Password must be between 6-30 characters alphanumeric",
    }),
  objectId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)

    .messages({
      "string.pattern.base": "Invalid ID format",
    }),
  gender: Joi.string().valid("Male", "Female"),
  phone: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .messages({
      "string.pattern.base": "Invalid phone number format",
    }),
};
