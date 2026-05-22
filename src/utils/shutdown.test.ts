import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleShutdown } from './shutdown.js';
import { Server } from 'http';
import { CONSTANTS } from '../constants/constants.js';

describe('Shutdown Utility', () => {
    let mockServer: Server;
    let exitSpy: any;

    beforeEach(() => {
        vi.useFakeTimers();
        
        // Mock the server
        mockServer = {
            close: vi.fn((callback?: (err?: Error) => void) => {
                if (callback) callback();
                return mockServer;
            })
        } as unknown as Server;

        // Mock process.exit
        exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
        
        // Mock console
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('should close the server and exit process with code 0 on success', () => {
        handleShutdown(mockServer, 'SIGINT');

        expect(mockServer.close).toHaveBeenCalled();
        expect(exitSpy).toHaveBeenCalledWith(0);
    });

    it('should forcefully exit with code 1 after the safety timeout', () => {
        // Mock close to NOT call the callback immediately
        (mockServer.close as any).mockImplementation(() => mockServer);

        handleShutdown(mockServer, 'SIGTERM');

        expect(mockServer.close).toHaveBeenCalled();
        expect(exitSpy).not.toHaveBeenCalled();

        // Fast-forward time
        vi.advanceTimersByTime(CONSTANTS.SHUTDOWN_TIMEOUT_MS);

        expect(exitSpy).toHaveBeenCalledWith(1);
    });
});
