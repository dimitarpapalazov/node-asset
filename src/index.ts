import app from './app.js';
import { config } from './config/config.js';
import { handleShutdown } from './utils/shutdown.js';
import { queueService } from './services/queue.service.js';
import { startExportWorker } from './services/export.worker.js';

const start = async () => {
    try {
        await queueService.connect();
        await startExportWorker();

        const server = app.listen(config.port, () => {
            console.log(`Server is running on port ${config.port}`);
        });

        process.on('SIGINT', async () => await handleShutdown(server, 'SIGINT'));
        process.on('SIGTERM', async () => await handleShutdown(server, 'SIGTERM'));
    } catch (error) {
        console.error('Failed to start application:', error);
        process.exit(1);
    }
};

start();
