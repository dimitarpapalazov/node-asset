import { describe, it, expect } from 'vitest';
import { getHealthStatus } from './health.service.js';

describe('Health Service', () => {
    it('should return the correct health status object', () => {
        const status = getHealthStatus();

        expect(status).toHaveProperty('status', 'UP');
        expect(status).toHaveProperty('timestamp');
        
        // Ensure timestamp is a valid ISO string
        const parsedDate = new Date(status.timestamp);
        expect(parsedDate.toISOString()).toBe(status.timestamp);
    });
});
