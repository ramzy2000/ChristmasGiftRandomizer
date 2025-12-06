import app from './app.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 3001;

// Initialize database (import triggers initialization)
import './database/db.js';

app.listen(PORT, () => {
  logger.info({ port: PORT }, `Server running on http://localhost:${PORT}`);
});

