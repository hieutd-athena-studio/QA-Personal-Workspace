import type Database from 'better-sqlite3'
import { snapshotDatabase } from '../backup'
import { ALL_MIGRATIONS } from './index'

export class MigrationError extends Error {
  constructor(
    public readonly version: number,
    public readonly cause: unknown
  ) {
    super(`migration ${version} failed: ${cause instanceof Error ? cause.message : String(cause)}`)
    this.name = 'MigrationError'
  }
}

export interface MigrationResult {
  applied: number
  snapshotPath?: string
}

export function runMigrations(db: Database.Database, userDataPath: string | null): MigrationResult {
  ensureMetaTable(db)
  const current = readSchemaVersion(db)
  const pending = ALL_MIGRATIONS.filter((m) => m.version > current).sort(
    (a, b) => a.version - b.version
  )

  if (pending.length === 0) {
    return { applied: 0 }
  }

  let snapshotPath: string | undefined
  if (userDataPath) {
    snapshotPath = snapshotDatabase(db, userDataPath)
  }

  for (const migration of pending) {
    db.exec('BEGIN TRANSACTION')
    try {
      migration.up(db)
      db.prepare(
        'UPDATE meta SET schema_version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1'
      ).run(migration.version)
      db.exec('COMMIT')
    } catch (err) {
      db.exec('ROLLBACK')
      throw new MigrationError(migration.version, err)
    }
  }

  return { applied: pending.length, snapshotPath }
}

function ensureMetaTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      schema_version INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
    INSERT OR IGNORE INTO meta (id, schema_version) VALUES (1, 0);
  `)
}

function readSchemaVersion(db: Database.Database): number {
  const row = db.prepare('SELECT schema_version FROM meta WHERE id = 1').get() as
    | { schema_version: number }
    | undefined
  return row?.schema_version ?? 0
}
