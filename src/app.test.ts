import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './app.js';

describe('Security Headers (Helmet)', () => {
    it('should have security headers set by helmet', async () => {
        const response = await request(app).get('/health');
        
        // Helmet sets several headers, let's check some common ones
        expect(response.headers['x-dns-prefetch-control']).toBe('off');
        expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['x-xss-protection']).toBe('0');
        expect(response.headers['content-security-policy']).toBeDefined();
        expect(response.headers['strict-transport-security']).toBeDefined();
    });
});
