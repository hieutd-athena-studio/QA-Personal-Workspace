import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import * as schema from './schema'

let dbInstance: Database.Database | null = null
let drizzleInstance: BetterSQLite3Database<typeof schema> | null = null

export function getDbPath(): string {
  const override = process.env['QA_WORKSPACE_DB_PATH']
  if (override) return override
  return join(app.getPath('userData'), 'qa-workspace.db')
}

export function getUserDataPath(): string {
  const override = process.env['QA_WORKSPACE_USER_DATA']
  if (override) return override
  return app.getPath('userData')
}

export function getDb(): {
  raw: Database.Database
  drizzle: BetterSQLite3Database<typeof schema>
} {
  if (!dbInstance || !drizzleInstance) {
    dbInstance = new Database(getDbPath())
    dbInstance.pragma('journal_mode = WAL')
    dbInstance.pragma('foreign_keys = ON')
    drizzleInstance = drizzle(dbInstance, { schema })
  }
  return { raw: dbInstance, drizzle: drizzleInstance }
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
    drizzleInstance = null
  }
}
