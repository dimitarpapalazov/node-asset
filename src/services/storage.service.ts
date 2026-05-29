import { mkdir, writeFile, readFile, access, unlink } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { config } from '../config/config.js';
import { computeHash } from '../utils/hash.js';
import { logger } from './logger/logger.factory.js';
import { LogLevel } from './logger/index.js';

/**
 * Service for Content-Addressable Storage (CAS).
 */
export class StorageService {
    private readonly baseDir: string;

    constructor(baseDir: string = config.storage.uploadsDir) {
        this.baseDir = baseDir;
    }

    /**
     * Saves a buffer to the CAS storage.
     * @param buffer - The file content.
     * @returns The SHA-256 hash of the file.
     */
    async save(buffer: Buffer): Promise<string> {
        const hash = computeHash(buffer);
        const filePath = this.getFilePath(hash);
        const dir = dirname(filePath);

        await mkdir(dir, { recursive: true });
        
        // If file already exists, we don't need to overwrite it (CAS property)
        if (!await this.exists(hash)) {
            await writeFile(filePath, buffer);

            logger.log({
                timestamp: new Date().toISOString(),
                level: LogLevel.INFO,
                message: `New file written to storage: ${hash}`,
                environment: config.env,
                traceId: 'system',
            });
        }

        return hash;
    }

    /**
     * Retrieves a file from CAS storage.
     * @param hash - The SHA-256 hash of the file.
     * @returns The file content as a Buffer.
     */
    async get(hash: string): Promise<Buffer> {
        const filePath = this.getFilePath(hash);
        return readFile(filePath);
    }

    /**
     * Checks if a file exists in CAS storage.
     * @param hash - The SHA-256 hash of the file.
     * @returns True if the file exists.
     */
    async exists(hash: string): Promise<boolean> {
        const filePath = this.getFilePath(hash);
        try {
            await access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Deletes a file from CAS storage.
     * Note: In a pure CAS system, we might want to check if other assets reference this hash.
     * @param hash - The SHA-256 hash of the file.
     */
    async delete(hash: string): Promise<void> {
        const filePath = this.getFilePath(hash);
        if (await this.exists(hash)) {
            await unlink(filePath);

            logger.log({
                timestamp: new Date().toISOString(),
                level: LogLevel.INFO,
                message: `File deleted from storage: ${hash}`,
                environment: config.env,
                traceId: 'system',
            });
        }
    }

    /**
     * Computes the full path for a given hash.
     * Structure: baseDir/hh/hh/hash
     */
    private getFilePath(hash: string): string {
        return join(
            this.baseDir,
            hash.substring(0, 2),
            hash.substring(2, 4),
            hash
        );
    }
}

export const storageService = new StorageService();
