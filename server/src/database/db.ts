import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../../data', 'gift-exchange.db');
const schemaPath = join(__dirname, 'schema.sql');

// Ensure data directory exists
import { mkdirSync } from 'fs';
const dataDir = join(__dirname, '../../data');
try {
  mkdirSync(dataDir, { recursive: true });
} catch (error) {
  // Directory might already exist
}

// Initialize database
const db = new Database(dbPath);

// Run schema
const schema = readFileSync(schemaPath, 'utf-8');
db.exec(schema);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export default db as DatabaseType;

