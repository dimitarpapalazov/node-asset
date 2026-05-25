import { describe, it, expect, vi } from 'vitest';
import { ConsoleLogger, FileLogger, CompositeLogger, LogLevel } from './index.js';
import * as fs from 'node:fs/promises';

vi.mock('node:fs/promises', async () => {
    const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
    return {
        ...actual,
        appendFile: vi.fn().mockResolvedValue(undefined),
        mkdir: vi.fn().mockResolvedValue(undefined),
    };
});

const mockEntry = {
    timestamp: '2026-05-25T20:00:00Z',
    level: LogLevel.INFO,
    message: 'test message',
    environment: 'test',
    traceId: 'abc-123'
};

describe('Logging System (Composite Pattern)', () => {
    describe('ConsoleLogger', () => {
        it('should log minified JSON to console', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            const logger = new ConsoleLogger();
            logger.log(mockEntry);
            expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(mockEntry));
            consoleSpy.mockRestore();
        });
    });

    describe('FileLogger', () => {
        it('should append minified JSON to file and create directory', async () => {
            const logger = new FileLogger('logs/test.log');
            await logger.log(mockEntry);
            expect(fs.mkdir).toHaveBeenCalledWith('logs', { recursive: true });
            expect(fs.appendFile).toHaveBeenCalledWith('logs/test.log', JSON.stringify(mockEntry) + '\n');
        });
    });

    describe('CompositeLogger', () => {
        it('should log to all added loggers', async () => {
            const mockLogger1 = { log: vi.fn() };
            const mockLogger2 = { log: vi.fn() };
            const composite = new CompositeLogger();
            
            composite.add(mockLogger1);
            composite.add(mockLogger2);
            
            await composite.log(mockEntry);
            
            expect(mockLogger1.log).toHaveBeenCalledWith(mockEntry);
            expect(mockLogger2.log).toHaveBeenCalledWith(mockEntry);
        });
    });
});
