import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import exchangesRouter from './routes/exchanges.js';
import participantsRouter from './routes/participants.js';
import notificationsRouter from './routes/notifications.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use(pinoHttp({ logger }));

// Routes
app.use('/api/exchanges', exchangesRouter);
app.use('/api/participants', participantsRouter);
app.use('/api/notifications', notificationsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;

