import express from 'express';
import { config } from './config/config.js';
import apiRoutes from './routes/index.js';

const app = express();

app.use(express.json());

app.use('/', apiRoutes);

const server = app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
});

// --- Graceful Shutdown ---

process.on('SIGINT', () => {
    shutdown('SIGINT');
});

process.on('SIGTERM', () => {
    shutdown('SIGTERM');
});

/**
 * Gracefully shuts down the application.
 * 
 * @param signal - The signal that triggered the shutdown.
 */
function shutdown(signal: string): void {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);

    server.close(() => {
        console.log('Http server closed.');
        process.exit(0);
    });

    // Force shutdown if graceful shutdown takes too long
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
}
