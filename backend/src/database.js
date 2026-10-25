import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDirectory = fileURLToPath(new URL('../', import.meta.url));
const defaultDatabasePath = resolve(backendDirectory, 'data', 'alerts.sqlite');

export function createDatabase(databasePath = process.env.DATABASE_PATH || defaultDatabasePath) {
  const resolvedPath = resolve(databasePath);
  mkdirSync(dirname(resolvedPath), { recursive: true });

  const database = new Database(resolvedPath);
  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');
  database.exec(`
    CREATE TABLE IF NOT EXISTS ocorrencias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bairro TEXT NOT NULL,
      rua TEXT NOT NULL,
      tipo TEXT NOT NULL,
      descricao TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ocorrencias_created_at
      ON ocorrencias (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ocorrencias_bairro_created_at
      ON ocorrencias (bairro, created_at DESC);
  `);
  database.prepare('DELETE FROM ocorrencias WHERE created_at < ?').run(
    new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  );

  return database;
}
