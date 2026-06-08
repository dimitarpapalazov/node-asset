import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './app.js';

describe('Security Middleware', () => {
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

    it('should have CORS headers enabled', async () => {
        const response = await request(app).get('/health');

        expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('should have rate limit headers', async () => {
        const response = await request(app).get('/health');

        // express-rate-limit headers
        // By default it uses legacy headers (x-ratelimit-*)
        expect(response.headers['x-ratelimit-limit']).toBeDefined();
        expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });
});
