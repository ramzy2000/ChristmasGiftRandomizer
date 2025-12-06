import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Create a test database in memory for testing
 */
export function createTestDb(): Database.Database {
  const db = new Database(':memory:');
  
  // Load and execute schema
  const schemaPath = join(__dirname, '../database/schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  return db;
}

/**
 * Clean up test database
 */
export function closeTestDb(db: Database.Database): void {
  db.close();
}

