import { Request, Response, NextFunction } from 'express';
import { ZodObject } from 'zod';

/**
 * Middleware to validate request data against a Zod schema.
 * Validates body, query, and params.
 */
export const validate = (schema: ZodObject<any>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validatedData = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
                cookies: req.cookies,
            }) as any;

            // Update request with validated data to ensure type safety in controllers
            req.body = validatedData.body ?? req.body;
            req.query = validatedData.query ?? req.query;
            req.params = validatedData.params ?? req.params;
            req.cookies = validatedData.cookies ?? req.cookies;

            next();
        } catch (error) {
            next(error);
        }
    };
};
