import { z } from 'zod';

export const getProjectSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid project ID format'),
    }),
});

export type GetProjectData = z.infer<typeof getProjectSchema>;

export const createProjectSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Project name is required').max(100, 'Project name is too long'),
    }),
});

export type CreateProjectData = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid project ID format'),
    }),
    body: z.object({
        name: z.string().min(1, 'Project name is required').max(100, 'Project name is too long'),
    }),
});

export type UpdateProjectData = z.infer<typeof updateProjectSchema>;

export const deleteProjectSchema = getProjectSchema;

export type DeleteProjectData = z.infer<typeof deleteProjectSchema>;

export const exportProjectSchema = getProjectSchema;

export type ExportProjectData = z.infer<typeof exportProjectSchema>;

export const getExportJobStatusSchema = z.object({
    params: z.object({
        jobId: z.string().uuid('Invalid job ID format'),
    }),
});

export type GetExportJobStatusData = z.infer<typeof getExportJobStatusSchema>;

export const downloadExportSchema = getExportJobStatusSchema;

export type DownloadExportData = z.infer<typeof downloadExportSchema>;

export const importProjectSchema = z.object({});

export type ImportProjectData = z.infer<typeof importProjectSchema>;

export type CreateProjectInput = z.infer<typeof createProjectSchema>['body'];
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>['body'];
