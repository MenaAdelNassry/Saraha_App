import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../utils/AppError';

export const validate = (schema: Joi.ObjectSchema, source: "body" | "query" | "params" = "body") => {
    return (req: Request, res: Response, next: NextFunction) => {
        const dataToValidate = req[source];
        const { error, value } = schema.validate(dataToValidate, {
            errors: { wrap: { label: false } },
            abortEarly: false
        });

        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join(', ');
            return next(new AppError(errorMessage, 400));
        }

        if(source === "query" || source === "params") {
            Object.assign(req[source], value);
        } else {
            req[source] = value;
        }
        next();
    };
};
