import express from 'express';
import cors from 'cors';
import exchangesRouter from './routes/exchanges.js';
import participantsRouter from './routes/participants.js';
import notificationsRouter from './routes/notifications.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/exchanges', exchangesRouter);
app.use('/api/participants', participantsRouter);
app.use('/api/notifications', notificationsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;

