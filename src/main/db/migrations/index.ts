import type Database from 'better-sqlite3'

export interface Migration {
  version: number
  name: string
  up: (db: Database.Database) => void
}

const m0001_initial: Migration = {
  version: 1,
  name: '0001-initial',
  up: (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS meta (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        schema_version INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      );

      INSERT OR IGNORE INTO meta (id, schema_version) VALUES (1, 0);

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY NOT NULL,
        display_prefix TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL,
        case_counter INTEGER NOT NULL DEFAULT 0,
        plan_counter INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE UNIQUE INDEX IF NOT EXISTS projects_display_prefix_idx
        ON projects(display_prefix);
    `)
  }
}

export const ALL_MIGRATIONS: Migration[] = [m0001_initial]
