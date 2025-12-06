import app from './app.js';

const PORT = process.env.PORT || 3001;

// Initialize database (import triggers initialization)
import './database/db.js';

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

