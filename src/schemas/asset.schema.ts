import { z } from 'zod';
import { AssetFit } from '../constants/constants.js';

export const uploadAssetSchema = z.object({
    body: z.object({
        projectId: z.string().uuid('Invalid project ID format'),
        name: z.string().min(1, 'Asset name is required'),
    }),
});

export type UploadAssetData = z.infer<typeof uploadAssetSchema>;

export const getAssetsByProjectSchema = z.object({
    params: z.object({
        projectId: z.string().uuid('Invalid project ID format'),
    }),
});

export type GetAssetsByProjectData = z.infer<typeof getAssetsByProjectSchema>;

export const getAssetSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid asset ID format'),
    }),
});

export type GetAssetData = z.infer<typeof getAssetSchema>;

export const getAssetVersionsSchema = getAssetSchema;

export type GetAssetVersionsData = z.infer<typeof getAssetVersionsSchema>;

export const manipulateAssetSchema = z.object({
    params: z.object({
        assetId: z.string().uuid('Invalid asset ID format'),
        versionId: z.string().uuid('Invalid version ID format'),
    }),
    body: z.object({
        width: z.preprocess((val) => (val === undefined ? undefined : Number(val)), z.number().int().positive().optional()),
        height: z.preprocess((val) => (val === undefined ? undefined : Number(val)), z.number().int().positive().optional()),
        fit: z.nativeEnum(AssetFit).optional(),
        format: z.enum(['jpeg', 'png', 'webp', 'avif', 'tiff']).optional(),
    }),
});

export type ManipulateAssetData = z.infer<typeof manipulateAssetSchema>;

export const deleteAssetSchema = getAssetSchema;

export type DeleteAssetData = z.infer<typeof deleteAssetSchema>;

export const generateAssetKeySchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid asset ID format'),
    }),
    body: z.object({
        expiresInSeconds: z.number().int().positive().optional(),
    }),
});

export type GenerateAssetKeyData = z.infer<typeof generateAssetKeySchema>;

export const getPublicAssetSchema = z.object({
    params: z.object({
        key: z.string().min(1, 'Key is required'),
    }),
});

export type GetPublicAssetData = z.infer<typeof getPublicAssetSchema>;

export type UploadAssetInput = z.infer<typeof uploadAssetSchema>['body'];
export type ManipulateAssetInput = z.infer<typeof manipulateAssetSchema>['body'];
export type GenerateAssetKeyInput = z.infer<typeof generateAssetKeySchema>['body'];
