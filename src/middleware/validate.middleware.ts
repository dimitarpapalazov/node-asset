import { Request, Response, NextFunction } from 'express';
import { ZodObject } from 'zod';

/**
 * Middleware to validate request data against a Zod schema.
 * Validates body, query, and params and stores them in req.validData.
 */
export const validate = (schema: ZodObject<any>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validatedData = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
                cookies: req.cookies,
            });

            // Store validated data in a custom field to avoid mutating standard Express properties
            req.validData = validatedData;

            next();
        } catch (error) {
            next(error);
        }
    };
};
