import express, { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
