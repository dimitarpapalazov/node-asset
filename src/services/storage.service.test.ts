import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

// Mock config BEFORE importing StorageService
vi.mock('../config/config.js', () => ({
    config: {
        storage: {
            uploadsDir: 'test-uploads'
        }
    }
}));

import { StorageService } from './storage.service.js';

describe('StorageService', () => {
    const testUploadsDir = join(process.cwd(), 'test-uploads');
    const storage = new StorageService(testUploadsDir);

    beforeAll(async () => {
        await mkdir(testUploadsDir, { recursive: true });
    });

    afterAll(async () => {
        await rm(testUploadsDir, { recursive: true, force: true });
    });

    it('should save a file and return its hash', async () => {
        const content = Buffer.from('test storage content');
        const hash = await storage.save(content);
        
        expect(hash).toBeDefined();
        expect(await storage.exists(hash)).toBe(true);
    });

    it('should retrieve saved content correctly', async () => {
        const content = Buffer.from('another test');
        const hash = await storage.save(content);
        
        const retrieved = await storage.get(hash);
        expect(retrieved.toString()).toBe('another test');
    });

    it('should return false for non-existent file', async () => {
        const exists = await storage.exists('non-existent-hash');
        expect(exists).toBe(false);
    });

    it('should delete a file', async () => {
        const content = Buffer.from('delete me');
        const hash = await storage.save(content);
        
        await storage.delete(hash);
        expect(await storage.exists(hash)).toBe(false);
    });

    it('should handle duplicate saves (CAS)', async () => {
        const content = Buffer.from('duplicate content');
        const hash1 = await storage.save(content);
        const hash2 = await storage.save(content);
        
        expect(hash1).toBe(hash2);
        expect(await storage.exists(hash1)).toBe(true);
    });
});
