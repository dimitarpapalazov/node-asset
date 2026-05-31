import { z } from 'zod';

export const getProjectSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid project ID format'),
    }),
});

export const createProjectSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Project name is required').max(100, 'Project name is too long'),
    }),
});

export const updateProjectSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid project ID format'),
    }),
    body: z.object({
        name: z.string().min(1, 'Project name is required').max(100, 'Project name is too long'),
    }),
});

export const deleteProjectSchema = getProjectSchema;
export const exportProjectSchema = getProjectSchema;

export type CreateProjectInput = z.infer<typeof createProjectSchema>['body'];
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>['body'];
