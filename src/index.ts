import express, { Request, Response } from 'express';
import { config } from './config/config.js';

const app = express();

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'UP' });
});

app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
});
