import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './auth/routes';
import { tasksRouter } from './tasks/routes';
import { profileRouter } from './profile/routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);
app.use('/tasks', tasksRouter);
app.use('/profile', profileRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => {
  console.log(`Stairwise API listening on port ${PORT}`);
});
