import { Server } from 'http';
import { CONSTANTS } from '../constants/constants.js';
import { queueService } from '../services/queue.service.js';

/**
 * Orchestrates the graceful shutdown of the application.
 * 
 * @param server - The Express HTTP server instance.
 * @param signal - The signal that triggered the shutdown.
 */
export const handleShutdown = async (server: Server, signal: string): Promise<void> => {
    // if I remove this comment, the server goes into a loop in docker. wtf?
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);

    try {
        await queueService.disconnect();
        console.log('Queue service disconnected.');
    } catch (error) {
        console.error('Error during queue service disconnect:', error);
    }

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
