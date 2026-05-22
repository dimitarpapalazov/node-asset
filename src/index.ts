import express from 'express';
import { config } from './config/config.js';
import apiRoutes from './routes/index.js';
import { handleShutdown } from './utils/shutdown.js';

const app = express();

app.use(express.json());

app.use('/', apiRoutes);

const server = app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
});

process.on('SIGINT', () => handleShutdown(server, 'SIGINT'));
process.on('SIGTERM', () => handleShutdown(server, 'SIGTERM'));
