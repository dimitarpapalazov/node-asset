import { z } from 'zod';
import { AssetFit } from '../constants/constants.js';

export const uploadAssetSchema = z.object({
    body: z.object({
        projectId: z.string().uuid('Invalid project ID format'),
        name: z.string().min(1, 'Asset name is required'),
    }),
});

export const getAssetsByProjectSchema = z.object({
    params: z.object({
        projectId: z.string().uuid('Invalid project ID format'),
    }),
});

export const getAssetSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid asset ID format'),
    }),
});

export const getAssetVersionsSchema = getAssetSchema;

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

export const deleteAssetSchema = getAssetSchema;

export type UploadAssetInput = z.infer<typeof uploadAssetSchema>['body'];
export type ManipulateAssetInput = z.infer<typeof manipulateAssetSchema>['body'];
