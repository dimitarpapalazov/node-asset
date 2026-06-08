import { mkdir, writeFile, readFile, access, unlink, rename } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { join, dirname } from 'node:path';
import { config } from '../config/config.js';
import { computeHash } from '../utils/hash.js';
import { logger } from './logger/logger.factory.js';
import { LogLevel } from './logger/index.js';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

/**
 * Service for Content-Addressable Storage (CAS).
 */
export class StorageService {
    private readonly baseDir: string;
    private readonly tmpDir: string;

    constructor(baseDir: string = config.storage.uploadsDir) {
        this.baseDir = baseDir;
        this.tmpDir = join(baseDir, 'tmp');
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

    async saveStream(stream: Readable): Promise<string> {
        await mkdir(this.tmpDir, { recursive: true });
        const tmpFileName = crypto.randomUUID();
        const tmpPath = join(this.tmpDir, tmpFileName);

        const hash = crypto.createHash('sha256');
        const writeStream = createWriteStream(tmpPath);

        await pipeline(
            stream,
            async function* (source) {
                for await (const chunk of source) {
                    hash.update(chunk);
                    yield chunk;
                }
            },
            writeStream
        );

        const finalHash = hash.digest('hex');
        const finalPath = this.getFilePath(finalHash);
        const finalDir = dirname(finalPath);

        if (await this.exists(finalHash)) {
            await unlink(tmpPath);
        } else {
            await mkdir(finalDir, { recursive: true });
            await rename(tmpPath, finalPath);

            logger.log({
                timestamp: new Date().toISOString(),
                level: LogLevel.INFO,
                message: `New file written to storage via stream: ${finalHash}`,
                environment: config.env,
                traceId: 'system',
            });
        }

        return finalHash;
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
     * Retrieves a file from CAS storage as a stream.
     * @param hash - The SHA-256 hash of the file.
     */
    getStream(hash: string): Readable {
        const filePath = this.getFilePath(hash);
        return createReadStream(filePath);
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
