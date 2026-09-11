import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './features/authentication/routes/auth.routes.js';
import questionRoutes from './features/questions/question.routes.js';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN?.split(',') ?? ['http://localhost:5173'],
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get('/api/progress/summary', (_req, res) => {
  res.status(200).json({
    solvedQuestionIds: [],
    attemptedQuestionIds: [],
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', questionRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
});

