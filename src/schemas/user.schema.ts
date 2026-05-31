import { z } from 'zod';

export const getUserSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid user ID format'),
    }),
});

export const deleteUserSchema = getUserSchema;
