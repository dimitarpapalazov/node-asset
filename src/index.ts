import app from './app.js';
import { config } from './config/config.js';
import { handleShutdown } from './utils/shutdown.js';

const server = app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
});

process.on('SIGINT', () => handleShutdown(server, 'SIGINT'));
process.on('SIGTERM', () => handleShutdown(server, 'SIGTERM'));
