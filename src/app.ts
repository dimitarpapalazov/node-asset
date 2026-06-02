import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import apiRoutes from './routes/index.js';
import { errorMiddleware } from './middleware/error.middleware.js';

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

app.use('/', apiRoutes);

app.use(errorMiddleware);

export default app;
