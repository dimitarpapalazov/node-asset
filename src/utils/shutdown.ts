import { Server } from 'http';
import { CONSTANTS } from '../constants/constants.js';

/**
 * Orchestrates the graceful shutdown of the application.
 * 
 * @param server - The Express HTTP server instance.
 * @param signal - The signal that triggered the shutdown.
 */
export const handleShutdown = (server: Server, signal: string): void => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);

    server.close(() => {
        console.log('Http server closed.');
        process.exit(0);
    });

    // Force shutdown if graceful shutdown takes too long
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, CONSTANTS.SHUTDOWN_TIMEOUT_MS);
};
