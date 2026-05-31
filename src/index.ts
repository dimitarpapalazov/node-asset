import express from 'express';
import cookieParser from 'cookie-parser';
import { config } from './config/config.js';
import apiRoutes from './routes/index.js';
import { handleShutdown } from './utils/shutdown.js';
import { errorMiddleware } from './middleware/error.middleware.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/', apiRoutes);

app.use(errorMiddleware);

const server = app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
});

process.on('SIGINT', () => handleShutdown(server, 'SIGINT'));
process.on('SIGTERM', () => handleShutdown(server, 'SIGTERM'));
