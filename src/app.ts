import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import apiRoutes from './routes/index.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { config } from './config/config.js';

const app = express();

app.use(helmet());
app.use(cors(config.cors));
app.use(rateLimit(config.rateLimit));
app.use(express.json());
app.use(cookieParser());

app.use('/', apiRoutes);

app.use(errorMiddleware);

export default app;
