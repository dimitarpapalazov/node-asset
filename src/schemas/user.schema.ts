import { z } from 'zod';

export const getUserSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid user ID format'),
    }),
});

export type GetUserData = z.infer<typeof getUserSchema>;

export const deleteUserSchema = getUserSchema;

export type DeleteUserData = z.infer<typeof deleteUserSchema>;
