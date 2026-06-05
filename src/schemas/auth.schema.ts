import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(8, 'Password must be at least 8 characters long'),
    }),
});

export type RegisterData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(1, 'Password is required'),
    }),
});

export type LoginData = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
    cookies: z.object({
        refreshToken: z.string().min(1, 'Refresh token is required'),
    }),
});

export type RefreshData = z.infer<typeof refreshSchema>;

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
