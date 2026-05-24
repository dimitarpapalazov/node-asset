import crypto from 'node:crypto';

/**
 * Computes the SHA-256 hash of a buffer.
 * @param buffer - The buffer to hash.
 * @returns The hex-encoded hash.
 */
export function computeHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}
