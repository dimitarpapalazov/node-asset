import { describe, it, expect } from 'vitest';
import { computeHash } from './hash.js';

describe('hash utility', () => {
    it('should compute consistent SHA-256 hash for a buffer', () => {
        const buffer = Buffer.from('hello world');
        const hash1 = computeHash(buffer);
        const hash2 = computeHash(buffer);
        
        expect(hash1).toBe(hash2);
        // SHA-256 of "hello world"
        expect(hash1).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
    });

    it('should compute different hashes for different buffers', () => {
        const hash1 = computeHash(Buffer.from('hello'));
        const hash2 = computeHash(Buffer.from('world'));
        
        expect(hash1).not.toBe(hash2);
    });
});
