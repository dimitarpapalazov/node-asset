import { Request } from 'express';

/**
 * Utility type to represent an Express Request with Zod-validated data.
 * T should be the inferred type of the Zod schema.
 */
export type ValidatedRequest<T> = Omit<Request, 'validData'> & {
    validData: T;
};
